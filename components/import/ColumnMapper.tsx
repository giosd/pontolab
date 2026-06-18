"use client";

import {
  IMPORT_FIELD_LABELS,
  getRequiredImportFields,
  type ColumnMapping,
  type ImportField,
  type ImportUserMode,
} from "@/types/import";

interface ColumnMapperProps {
  headers: string[];
  mapping: ColumnMapping;
  userMode: ImportUserMode;
  onChange: (mapping: ColumnMapping) => void;
}

const ALL_FIELDS: ImportField[] = [
  "date",
  "user",
  "activity",
  "task",
  "comment",
  "hours",
];

export function ColumnMapper({
  headers,
  mapping,
  userMode,
  onChange,
}: ColumnMapperProps) {
  const requiredFields = getRequiredImportFields(userMode);

  const updateField = (field: ImportField, header: string) => {
    onChange({
      ...mapping,
      [field]: header || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[#1E5F7A]">
          Mapeamento de colunas
        </h3>
        <p className="mt-1 text-sm text-[#38A8D8]">
          Associe as colunas do arquivo aos campos do PontoLab.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ALL_FIELDS.map((field) => {
          const required = requiredFields.includes(field);

          return (
            <label key={field} className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#1E5F7A]">
                {IMPORT_FIELD_LABELS[field]}
                {required ? " *" : ""}
              </span>
              <select
                value={mapping[field] ?? ""}
                onChange={(event) => updateField(field, event.target.value)}
                className="rounded-xl border border-[#D9EEF9] bg-white px-3 py-2 text-sm text-[#1E5F7A] outline-none focus:border-[#4EA8DE] focus:ring-2 focus:ring-[#89CFF0]/40"
              >
                <option value="">Não mapear</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>
    </div>
  );
}
