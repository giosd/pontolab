"use server";

import { revalidatePath } from "next/cache";

import { isAdmin, requireAuth } from "@/lib/auth";
import {
  logApprovedPreserved,
  logImport,
  logPeriodReplacement,
  logReopenApproved,
  logReplacePeriod,
} from "@/lib/services/audit.service";
import { applyColumnMapping } from "@/lib/import/column-mapping";
import {
  getApprovedInPeriodInfo,
  importRows,
  validateRows,
} from "@/lib/services/import.service";
import { createNotification } from "@/lib/services/notification.service";
import { NOTIFICATION_TYPES } from "@/lib/notifications/constants";
import type {
  ColumnMapping,
  ImportPreviewResult,
  ImportValidationOptions,
  MappedImportRow,
  RawImportRow,
  ValidatedImportRow,
} from "@/types/import";

export async function validateImportAction(
  rows: MappedImportRow[],
  options: ImportValidationOptions,
): Promise<ImportPreviewResult> {
  const session = await requireAuth();
  return validateRows(rows, session, options);
}

export async function validateMappedImportAction(
  rawRows: RawImportRow[],
  mapping: ColumnMapping,
  options: ImportValidationOptions,
): Promise<ImportPreviewResult> {
  const mapped = applyColumnMapping(rawRows, mapping);
  return validateImportAction(mapped, options);
}

export async function getReplacePeriodInfoAction(rows: ValidatedImportRow[]) {
  const session = await requireAuth();
  return getApprovedInPeriodInfo(rows, session);
}

export async function importRecordsAction(options: {
  fileName: string;
  rows: ValidatedImportRow[];
  importDuplicates: boolean;
  replacePeriod: boolean;
  reopenApproved?: boolean;
  importAsApproved?: boolean;
}) {
  const session = await requireAuth();
  const actor = {
    id: session.userId,
    name: session.name,
    email: session.email,
  };

  const { batch, replaceInfo, importedRows, totalValidHours } = await importRows({
    ...options,
    reopenApproved: Boolean(options.reopenApproved) && isAdmin(session),
    session,
  });

  revalidatePath("/registros");
  revalidatePath("/dashboard");
  revalidatePath("/importacoes");

  await logImport({
    entityId: batch.id,
    description: `Arquivo ${batch.fileName} importado.`,
    newData: {
      fileName: batch.fileName,
      totalRows: batch.totalRows,
      validRows: batch.validRows,
      errorRows: batch.errorRows,
      duplicatedRows: batch.duplicatedRows,
      importedRows: batch.importedRows,
      totalHours: totalValidHours,
      importAsApproved: Boolean(options.importAsApproved),
    },
    user: actor,
  });

  if (replaceInfo) {
    await logReplacePeriod({
      entityId: batch.id,
      newData: {
        startDate: replaceInfo.startDate,
        endDate: replaceInfo.endDate,
        affectedUsers: replaceInfo.affectedUsers,
        deletedRows: replaceInfo.deletedRows,
        importedRows,
      },
      user: actor,
    });

    await logPeriodReplacement({
      entityId: batch.id,
      description: `Substituição de período: ${replaceInfo.deletedRows} registro(s) substituído(s).`,
      newData: {
        startDate: replaceInfo.startDate,
        endDate: replaceInfo.endDate,
        affectedUsers: replaceInfo.affectedUsers,
        deletedRows: replaceInfo.deletedRows,
        importedRows,
      },
      user: actor,
    });

    if (replaceInfo.reopenedApprovedCount > 0) {
      await logReopenApproved({
        entityId: batch.id,
        description: `${replaceInfo.reopenedApprovedCount} registro(s) aprovado(s) reaberto(s) antes da substituição.`,
        newData: {
          count: replaceInfo.reopenedApprovedCount,
          startDate: replaceInfo.startDate,
          endDate: replaceInfo.endDate,
        },
        user: actor,
      });
    }

    if (replaceInfo.preservedApprovedCount > 0) {
      await logApprovedPreserved({
        entityId: batch.id,
        description: `${replaceInfo.preservedApprovedCount} registro(s) aprovado(s) preservado(s) na substituição.`,
        newData: {
          count: replaceInfo.preservedApprovedCount,
          hours: replaceInfo.preservedApprovedHours,
          startDate: replaceInfo.startDate,
          endDate: replaceInfo.endDate,
        },
        user: actor,
      });
    }
  }

  if (batch.errorRows > 0) {
    await createNotification({
      userId: session.userId,
      type: NOTIFICATION_TYPES.WARNING,
      title: "Importação concluída com erros",
      message: `${batch.fileName}: ${batch.importedRows} importado(s), ${batch.errorRows} com erro.`,
    });
  } else {
    await createNotification({
      userId: session.userId,
      type: NOTIFICATION_TYPES.IMPORT,
      title: "Importação concluída",
      message: `${batch.fileName}: ${batch.importedRows} registro(s) importado(s).`,
    });
  }

  return {
    id: batch.id,
    importedRows: batch.importedRows,
  };
}
