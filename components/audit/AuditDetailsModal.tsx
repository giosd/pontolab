"use client";

import { format } from "date-fns";

import { Modal } from "@/components/ui/Modal";
import { getActionLabel, getEntityLabel } from "@/lib/audit/constants";
import type { AuditLogDetail } from "@/types/audit";

interface AuditDetailsModalProps {
  open: boolean;
  loading: boolean;
  detail: AuditLogDetail | null;
  onClose: () => void;
}

function JsonBlock({ data }: { data: unknown }) {
  if (data === null || data === undefined) {
    return <p className="text-sm text-[var(--app-text-muted)]">—</p>;
  }

  return (
    <pre className="max-h-64 overflow-auto rounded-xl border border-[var(--app-border)] bg-[var(--app-card-secondary)] p-3 text-xs text-[var(--app-text)]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--app-text-muted)]">{label}</p>
      <p className="text-sm text-[var(--app-text)]">{value}</p>
    </div>
  );
}

export function AuditDetailsModal({
  open,
  loading,
  detail,
  onClose,
}: AuditDetailsModalProps) {
  return (
    <Modal open={open} title="Detalhe do evento" onClose={onClose}>
      {loading || !detail ? (
        <p className="text-sm text-[var(--app-text-muted)]">
          Carregando detalhes...
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Data/hora"
              value={format(new Date(detail.createdAt), "dd/MM/yyyy HH:mm:ss")}
            />
            <Field
              label="Usuário"
              value={detail.userName ?? detail.userEmail ?? "Sistema"}
            />
            <Field label="Ação" value={getActionLabel(detail.action)} />
            <Field label="Entidade" value={getEntityLabel(detail.entityType)} />
            <Field label="IP" value={detail.ipAddress ?? "—"} />
            <Field label="Identificador" value={detail.entityId ?? "—"} />
          </div>

          <div>
            <p className="text-xs font-medium text-[var(--app-text-muted)]">
              Descrição
            </p>
            <p className="text-sm text-[var(--app-text)]">
              {detail.description ?? "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-[var(--app-text-muted)]">
              Navegador
            </p>
            <p className="break-words text-sm text-[var(--app-text)]">
              {detail.userAgent ?? "—"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--app-text-muted)]">
                Dados anteriores
              </p>
              <JsonBlock data={detail.oldData} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--app-text-muted)]">
                Dados novos
              </p>
              <JsonBlock data={detail.newData} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
