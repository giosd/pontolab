export interface AuditLogListItem {
  id: string;
  createdAt: Date;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  description: string | null;
  ipAddress: string | null;
}

export interface AuditLogDetail extends AuditLogListItem {
  entityId: string | null;
  userId: string | null;
  userAgent: string | null;
  oldData: unknown;
  newData: unknown;
}

export interface AuditFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  search?: string;
  page?: number;
}

export interface AuditSummary {
  totalEvents: number;
  eventsToday: number;
  logins: number;
  criticalChanges: number;
}

export interface AuditLogsResult {
  items: AuditLogListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditUserOption {
  id: string;
  name: string;
}
