export const OFFICIAL_IMPORT_COLUMNS = [
  "Data",
  "Usuário",
  "Atividade",
  "Tarefa",
  "Comentário",
  "Horas",
] as const;

export type ImportField =
  | "date"
  | "user"
  | "activity"
  | "task"
  | "comment"
  | "hours";

export const REQUIRED_IMPORT_FIELDS: ImportField[] = [
  "date",
  "activity",
  "hours",
];

export type ImportUserMode = "logged_in" | "selected" | "from_file";

export interface ImportValidationOptions {
  userMode: ImportUserMode;
  selectedUserId?: string;
}

export function getRequiredImportFields(userMode: ImportUserMode): ImportField[] {
  const fields: ImportField[] = ["date", "activity", "hours"];

  if (userMode === "from_file") {
    fields.push("user");
  }

  return fields;
}

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  date: "Data",
  user: "Usuário",
  activity: "Atividade",
  task: "Tarefa",
  comment: "Comentário",
  hours: "Horas",
};

export const COLUMN_ALIASES: Record<ImportField, string[]> = {
  date: ["data", "date", "dia", "start date", "start"],
  user: [
    "usuário",
    "usuario",
    "user",
    "colaborador",
    "member",
    "nome",
    "name",
    "email",
  ],
  activity: ["atividade", "activity", "categoria", "category", "tags"],
  task: [
    "tarefa",
    "task",
    "descrição",
    "descricao",
    "description",
    "projeto",
    "project",
  ],
  comment: [
    "comentário",
    "comentario",
    "comment",
    "obs",
    "observação",
    "observacao",
    "notes",
  ],
  hours: [
    "horas",
    "hours",
    "tempo",
    "duration",
    "duração",
    "duracao",
    "time",
  ],
};

export type ImportRowStatus = "valid" | "duplicate" | "error";

export interface RawImportRow {
  lineNumber: number;
  values: Record<string, string>;
}

export interface MappedImportRow {
  lineNumber: number;
  date: string;
  user: string;
  activity: string;
  task: string;
  comment: string;
  hours: string;
}

export type ColumnMapping = Partial<Record<ImportField, string>>;

export interface ValidatedImportRow {
  lineNumber: number;
  date: string | null;
  userId: string | null;
  userName: string;
  activity: string;
  task: string;
  comment: string | null;
  hours: number | null;
  hoursOriginal: string | null;
  hoursDisplay: string | null;
  status: ImportRowStatus;
  message?: string;
}

export interface ImportValidationSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicatedRows: number;
  totalValidHours: number;
  minDate: string | null;
  maxDate: string | null;
}

export interface ImportPreviewResult {
  rows: ValidatedImportRow[];
  summary: ImportValidationSummary;
}

export interface ImportBatchRecord {
  id: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicatedRows: number;
  importedRows: number;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
  };
}

export interface ParseFileResult {
  headers: string[];
  rows: RawImportRow[];
  delimiter?: string;
}
