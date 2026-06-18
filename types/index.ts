export interface User {
  id: string;
  name: string;
  email: string | null;
  role: string;
  active: boolean;
  createdAt: Date;
  lastLoginAt?: Date | null;
  teamId?: string | null;
  teamName?: string | null;
}

export interface Team {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  userCount?: number;
  managerCount?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
  readAt: Date | null;
}

export interface NotificationFilters {
  read?: "all" | "read" | "unread";
  type?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string | null;
  role: string;
  active: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface TimeEntry {
  id: string;
  task: string;
  userId: string;
  date: Date;
  hours: number;
  comment: string | null;
  activity: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  submittedAt: Date | null;
  submittedById: string | null;
  approvedAt: Date | null;
  approvedById: string | null;
  rejectedAt: Date | null;
  rejectedById: string | null;
  rejectionReason: string | null;
  user?: User;
}

export interface TimeEntryFilters {
  userId?: string;
  startDate?: string;
  endDate?: string;
  activity?: string;
  task?: string;
  status?: string;
}

export interface DashboardFilters {
  userId?: string;
  activity?: string;
  startDate: string;
  endDate: string;
}

export interface HoursByDayItem {
  date: string;
  label: string;
  hours: number;
}

export interface HoursByActivityItem {
  activity: string;
  hours: number;
}

export interface HoursByUserItem {
  userName: string;
  hours: number;
}

export interface TopTaskItem {
  task: string;
  hours: number;
}

export interface DashboardSummaryEntry {
  id: string;
  date: Date;
  userName: string;
  task: string;
  activity: string;
  hours: number;
  comment: string | null;
  status: string;
}

export interface HoursByStatus {
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
}

export interface PendingApprovalUser {
  userName: string;
  count: number;
  hours: number;
}

export interface PendingApprovalsSummary {
  totalEntries: number;
  totalHours: number;
  topUsers: PendingApprovalUser[];
}

export interface DashboardData {
  totalHours: number;
  totalEntries: number;
  averageHoursPerDay: number;
  hoursToday: number;
  hoursByDay: HoursByDayItem[];
  hoursByActivity: HoursByActivityItem[];
  hoursByUser: HoursByUserItem[];
  topTasks: TopTaskItem[];
  entries: DashboardSummaryEntry[];
  hoursByStatus: HoursByStatus;
  pendingApprovals: PendingApprovalsSummary | null;
  balance: DashboardBalanceSummary | null;
  balanceOverview: BalanceOverview | null;
}

export interface DashboardBalanceSummary {
  expectedHours: number;
  workedHours: number;
  differenceHours: number;
  accumulatedBalanceHours: number;
  cumulativeSeries: { date: string; label: string; balance: number }[];
}

export interface ExportTimeEntry {
  date: Date | string;
  userName: string;
  task: string;
  activity: string;
  hours: number;
  comment: string | null;
  status?: string;
}

export interface ExportSummary {
  totalHours: number;
  totalEntries: number;
  averageHoursPerDay: number;
}

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  userName?: string;
  activity?: string;
  task?: string;
  periodLabel?: string;
}

export interface UserGoals {
  dailyGoalHours: number;
  weeklyGoalHours: number;
  monthlyGoalHours: number;
  allowNegativeBalance: boolean;
  timerRoundingMinutes: number;
}

export interface HourBalanceDailyRow {
  date: string;
  label: string;
  isBusinessDay: boolean;
  expectedHours: number;
  workedHours: number;
  differenceHours: number;
  cumulativeHours: number;
}

export interface HourBalanceMonthlyRow {
  month: number;
  label: string;
  expectedHours: number;
  workedHours: number;
  balanceHours: number;
}

export interface HourBalanceData {
  userId: string;
  userName: string;
  goals: UserGoals;
  businessDays: number;
  expectedHours: number;
  workedHours: number;
  balanceHours: number;
  accumulatedBalanceHours: number;
  dailyRows: HourBalanceDailyRow[];
  cumulativeSeries: { date: string; label: string; balance: number }[];
}

export interface MonthlyBalanceSummary {
  year: number;
  rows: HourBalanceMonthlyRow[];
  totalExpectedHours: number;
  totalWorkedHours: number;
  totalBalanceHours: number;
}

export interface BalanceOverviewUser {
  userId: string;
  userName: string;
  expectedHours: number;
  workedHours: number;
  balanceHours: number;
}

export interface BalanceOverview {
  users: BalanceOverviewUser[];
  topPositive: BalanceOverviewUser[];
  topNegative: BalanceOverviewUser[];
  belowGoal: BalanceOverviewUser[];
  aboveGoal: BalanceOverviewUser[];
}

export interface ReportFilters {
  userId?: string;
  activity?: string;
  status?: string;
  startDate: string;
  endDate: string;
}

export interface ReportPeriodSummary {
  startDate: string;
  endDate: string;
  label: string;
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  rejectedHours: number;
  draftHours: number;
  totalEntries: number;
  totalUsers: number;
}

export interface ReportUserHours {
  userId: string;
  userName: string;
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  rejectedHours: number;
  balanceHours: number;
}

export interface ReportActivityHours {
  activity: string;
  hours: number;
  percentage: number;
}

export interface ReportTaskHours {
  task: string;
  hours: number;
  count: number;
}

export interface PeriodReport {
  summary: ReportPeriodSummary;
  byUser: ReportUserHours[];
  byActivity: ReportActivityHours[];
  byTask: ReportTaskHours[];
}

export interface ActiveTimer {
  id: string;
  task: string;
  activity: string;
  comment: string | null;
  status: string;
  startedAt: string;
  pausedAt: string | null;
  totalPausedSeconds: number;
  currentElapsedSeconds: number;
  roundingMinutes: number;
  serverNow: string;
}

export interface TimerHistoryItem {
  id: string;
  task: string;
  activity: string;
  comment: string | null;
  status: string;
  startedAt: string;
  stoppedAt: string | null;
  elapsedSeconds: number;
  createdTimeEntryId: string | null;
}

export interface ExportBalanceSummary {
  userName: string;
  periodLabel: string;
  expectedHours: number;
  workedHours: number;
  balanceHours: number;
  accumulatedBalanceHours: number;
  dailyRows?: HourBalanceDailyRow[];
  monthly?: MonthlyBalanceSummary | null;
}
