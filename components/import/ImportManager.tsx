"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { ColumnMapper } from "@/components/import/ColumnMapper";
import { FileUploader } from "@/components/import/FileUploader";
import { ImportPeriodCard, ImportSummary } from "@/components/import/ImportSummary";
import { ImportPreviewTable } from "@/components/import/ImportPreviewTable";
import { ImportUserDestination } from "@/components/import/ImportUserDestination";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getReplacePeriodInfoAction,
  importRecordsAction,
  validateMappedImportAction,
} from "@/lib/actions/import";
import { useConfirm } from "@/hooks/useConfirm";
import { formatHours } from "@/lib/dates";
import { mapColumns } from "@/lib/import/column-mapping";
import { downloadImportTemplate, parseFile } from "@/lib/import/parse-file";
import type { ApprovedInPeriodInfo } from "@/lib/services/import.service";
import type {
  ColumnMapping,
  ImportPreviewResult,
  ImportUserMode,
  RawImportRow,
} from "@/types/import";
import { getRequiredImportFields } from "@/types/import";
import type { User } from "@/types";

type ImportStep = "upload" | "mapping" | "preview" | "done";

interface ImportManagerProps {
  isAdmin: boolean;
  canSelectUser?: boolean;
  currentUserId: string;
  currentUserName: string;
  users: User[];
}

function hasRequiredMapping(mapping: ColumnMapping, userMode: ImportUserMode) {
  return getRequiredImportFields(userMode).every((field) =>
    Boolean(mapping[field]),
  );
}

export function ImportManager({
  isAdmin,
  canSelectUser = isAdmin,
  currentUserId,
  currentUserName,
  users,
}: ImportManagerProps) {
  const confirm = useConfirm();
  const [step, setStep] = useState<ImportStep>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawImportRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [userMode, setUserMode] = useState<ImportUserMode>(
    canSelectUser ? "selected" : "logged_in",
  );
  const [selectedUserId, setSelectedUserId] = useState(currentUserId);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [importDuplicates, setImportDuplicates] = useState(false);
  const [replacePeriod, setReplacePeriod] = useState(false);
  const [reopenApproved, setReopenApproved] = useState(false);
  const [approvedInfo, setApprovedInfo] = useState<ApprovedInPeriodInfo | null>(
    null,
  );
  const [importAsApproved, setImportAsApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileSelected = (file: File) => {
    setError(null);
    setSuccessMessage(null);
    setPreview(null);
    setReplacePeriod(false);
    setReopenApproved(false);
    setApprovedInfo(null);
    setImportDuplicates(false);
    setImportAsApproved(false);

    startTransition(async () => {
      try {
        const parsed = await parseFile(file);

        if (parsed.headers.length === 0 || parsed.rows.length === 0) {
          setError("O arquivo não contém dados para importar.");
          return;
        }

        const suggestedMapping = mapColumns(parsed.headers);

        setFileName(file.name);
        setHeaders(parsed.headers);
        setRawRows(parsed.rows);
        setMapping(suggestedMapping);
        setStep("mapping");
      } catch (parseError) {
        setError(
          parseError instanceof Error
            ? parseError.message
            : "Erro ao ler o arquivo.",
        );
      }
    });
  };

  const handleValidate = () => {
    if (!hasRequiredMapping(mapping, userMode)) {
      setError("Mapeie todos os campos obrigatórios antes de continuar.");
      return;
    }

    if (userMode === "selected" && !selectedUserId) {
      setError("Selecione o usuário de destino da importação.");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const result = await validateMappedImportAction(rawRows, mapping, {
          userMode,
          selectedUserId:
            userMode === "selected" ? selectedUserId : undefined,
        });
        setPreview(result);
        setStep("preview");
      } catch (validateError) {
        setError(
          validateError instanceof Error
            ? validateError.message
            : "Erro ao validar o arquivo.",
        );
      }
    });
  };

  const handleImport = async () => {
    if (!preview) {
      return;
    }

    if (replacePeriod) {
      const replaceConfirmed = await confirm({
        title: "Substituir período",
        description:
          "Deseja substituir registros existentes deste período? Os registros atuais serão excluídos antes da importação.",
        confirmText: "Substituir",
        cancelText: "Cancelar",
        variant: "warning",
      });

      if (!replaceConfirmed) {
        return;
      }
    }

    const importConfirmed = await confirm({
      title: "Confirmar importação",
      description: `Deseja importar ${preview.summary.validRows} registro(s) válido(s) do arquivo ${fileName}?`,
      confirmText: "Importar Registros",
      cancelText: "Cancelar",
      variant: "info",
    });

    if (!importConfirmed) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const result = await importRecordsAction({
          fileName,
          rows: preview.rows,
          importDuplicates,
          replacePeriod,
          reopenApproved: isAdmin ? reopenApproved : false,
          importAsApproved: isAdmin ? importAsApproved : false,
        });

        setSuccessMessage(
          `${result.importedRows} registro(s) importado(s) com sucesso.`,
        );
        setStep("done");
      } catch (importError) {
        setError(
          importError instanceof Error
            ? importError.message
            : "Erro ao importar registros.",
        );
      }
    });
  };

  const resetFlow = () => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setUserMode(canSelectUser ? "selected" : "logged_in");
    setSelectedUserId(currentUserId);
    setPreview(null);
    setImportDuplicates(false);
    setReplacePeriod(false);
    setReopenApproved(false);
    setApprovedInfo(null);
    setImportAsApproved(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleToggleReplacePeriod = (checked: boolean) => {
    setReplacePeriod(checked);

    if (!checked) {
      setApprovedInfo(null);
      setReopenApproved(false);
      return;
    }

    if (!preview) {
      return;
    }

    startTransition(async () => {
      try {
        const info = await getReplacePeriodInfoAction(preview.rows);
        setApprovedInfo(info);
      } catch {
        setApprovedInfo(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importar registros"
        description="Importe apontamentos em lote a partir de arquivos CSV ou Excel."
        action={
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={downloadImportTemplate}
            >
              Baixar Modelo
            </Button>
            <Link href="/importacoes">
              <Button type="button" variant="ghost">
                Ver histórico
              </Button>
            </Link>
          </div>
        }
      />

      {error ? (
        <Card className="border-red-200 bg-red-50 text-sm text-[#EF4444]">
          {error}
        </Card>
      ) : null}

      {successMessage ? (
        <Card className="border-green-200 bg-green-50 text-sm text-[#22C55E]">
          {successMessage}
        </Card>
      ) : null}

      <Card className="border-[#D9EEF9] bg-white">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-[#4EA8DE]">Etapa 1</p>
            <h2 className="mt-1 text-lg font-semibold text-[#1E5F7A]">
              Selecionar arquivo
            </h2>
            <div className="mt-4">
              <FileUploader
                onFileSelected={handleFileSelected}
                disabled={isPending}
                selectedFileName={fileName || undefined}
              />
            </div>
          </div>

          {step !== "upload" ? (
            <div className="border-t border-[#D9EEF9] pt-6">
              <p className="text-sm font-medium text-[#4EA8DE]">Etapa 2</p>
              <h2 className="mt-1 text-lg font-semibold text-[#1E5F7A]">
                Leitura do arquivo
              </h2>
              <p className="mt-2 text-sm text-[#38A8D8]">
                {rawRows.length} registro(s) encontrado(s) em {headers.length}{" "}
                coluna(s).
              </p>
            </div>
          ) : null}

          {step === "mapping" || step === "preview" || step === "done" ? (
            <div className="border-t border-[#D9EEF9] pt-6">
              <p className="text-sm font-medium text-[#4EA8DE]">Etapa 3</p>
              <div className="mt-4 space-y-6">
                <ImportUserDestination
                  userMode={userMode}
                  selectedUserId={selectedUserId}
                  users={users}
                  isAdmin={canSelectUser}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  onUserModeChange={setUserMode}
                  onSelectedUserChange={setSelectedUserId}
                />

                <ColumnMapper
                  headers={headers}
                  mapping={mapping}
                  userMode={userMode}
                  onChange={setMapping}
                />
              </div>

              {step === "mapping" ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="bg-[#4EA8DE] hover:bg-[#3d96cc]"
                    disabled={isPending}
                    onClick={handleValidate}
                  >
                    Validar e pré-visualizar
                  </Button>
                  <Button type="button" variant="secondary" onClick={resetFlow}>
                    Cancelar
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {preview && (step === "preview" || step === "done") ? (
            <div className="space-y-6 border-t border-[#D9EEF9] pt-6">
              <div>
                <p className="text-sm font-medium text-[#4EA8DE]">
                  Pré-visualização
                </p>
                <div className="mt-4 space-y-4">
                  <ImportSummary summary={preview.summary} />
                  <ImportPeriodCard
                    minDate={preview.summary.minDate}
                    maxDate={preview.summary.maxDate}
                  />
                  <ImportPreviewTable rows={preview.rows} />
                </div>
              </div>

              {step === "preview" ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 text-sm text-[#1E5F7A]">
                      <input
                        type="checkbox"
                        checked={importDuplicates}
                        onChange={(event) =>
                          setImportDuplicates(event.target.checked)
                        }
                        className="h-4 w-4 rounded border-[#D9EEF9] text-[#4EA8DE]"
                      />
                      Importar registros duplicados
                    </label>

                    <label className="flex items-center gap-3 text-sm text-[#1E5F7A]">
                      <input
                        type="checkbox"
                        checked={replacePeriod}
                        onChange={(event) =>
                          handleToggleReplacePeriod(event.target.checked)
                        }
                        className="h-4 w-4 rounded border-[#D9EEF9] text-[#4EA8DE]"
                      />
                      Substituir registros do período
                    </label>

                    {replacePeriod && approvedInfo && approvedInfo.count > 0 ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                        <p className="font-medium">
                          Existem registros aprovados neste período.
                        </p>
                        <p className="mt-1">
                          {reopenApproved
                            ? "Eles serão reabertos e substituídos."
                            : "Eles serão preservados e não serão alterados."}
                        </p>
                        <p className="mt-1">
                          Quantidade: {approvedInfo.count} · Horas:{" "}
                          {formatHours(approvedInfo.hours)}
                        </p>

                        {isAdmin ? (
                          <label className="mt-3 flex items-center gap-3 text-sm text-amber-900 dark:text-amber-100">
                            <input
                              type="checkbox"
                              checked={reopenApproved}
                              onChange={(event) =>
                                setReopenApproved(event.target.checked)
                              }
                              className="h-4 w-4 rounded border-amber-300 text-amber-600"
                            />
                            Reabrir registros aprovados antes da substituição
                          </label>
                        ) : null}
                      </div>
                    ) : null}

                    {isAdmin ? (
                      <label className="flex items-center gap-3 text-sm text-[#1E5F7A]">
                        <input
                          type="checkbox"
                          checked={importAsApproved}
                          onChange={(event) =>
                            setImportAsApproved(event.target.checked)
                          }
                          className="h-4 w-4 rounded border-[#D9EEF9] text-[#4EA8DE]"
                        />
                        Importar como aprovado
                      </label>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      className="bg-[#4EA8DE] hover:bg-[#3d96cc]"
                      disabled={isPending}
                      onClick={handleImport}
                    >
                      Importar Registros
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => setStep("mapping")}
                    >
                      Voltar ao mapeamento
                    </Button>
                  </div>
                </div>
              ) : (
                <Button type="button" onClick={resetFlow}>
                  Nova importação
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
