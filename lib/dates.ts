import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  format,
  getDate,
  parseISO,
  setDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export type DateRange = {
  start: Date;
  end: Date;
};

export type DashboardPeriod =
  | "today"
  | "week"
  | "fortnight"
  | "24to24"
  | "custom";

export function getTodayRange(referenceDate = new Date()): DateRange {
  return {
    start: startOfDay(referenceDate),
    end: endOfDay(referenceDate),
  };
}

export function getCurrentWeekRange(referenceDate = new Date()): DateRange {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 });

  return {
    start: startOfDay(start),
    end: endOfDay(addDays(start, 6)),
  };
}

export function getCurrentFortnightRange(referenceDate = new Date()): DateRange {
  const day = getDate(referenceDate);
  const monthStart = startOfDay(
    new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1),
  );

  if (day <= 15) {
    return {
      start: monthStart,
      end: endOfDay(setDate(monthStart, 15)),
    };
  }

  return {
    start: startOfDay(setDate(monthStart, 16)),
    end: endOfDay(endOfMonth(referenceDate)),
  };
}

/**
 * Período 24→24 conforme SPEC 10: do dia 24 do mês anterior até o dia 23 do mês
 * atual (ou do dia 24 atual até o dia 23 do mês seguinte, quando já passou do
 * dia 24). Exemplo: hoje 17/06 → 24/05 a 23/06; hoje 30/06 → 24/06 a 23/07.
 */
export function get24To24Range(referenceDate = new Date()): DateRange {
  const day = getDate(referenceDate);
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  if (day >= 24) {
    const start = startOfDay(new Date(year, month, 24));
    const end = endOfDay(addDays(addMonths(start, 1), -1));
    return { start, end };
  }

  const start = startOfDay(new Date(year, month - 1, 24));
  const end = endOfDay(addDays(new Date(year, month, 24), -1));
  return { start, end };
}

export function getCurrent24To24Range(referenceDate = new Date()): DateRange {
  const day = getDate(referenceDate);
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  if (day >= 24) {
    const start = startOfDay(new Date(year, month, 24));
    const nextMonth = addMonths(start, 1);

    return {
      start,
      end: endOfDay(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 24)),
    };
  }

  const previousMonth = subMonths(referenceDate, 1);

  return {
    start: startOfDay(
      new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 24),
    ),
    end: endOfDay(new Date(year, month, 24)),
  };
}

export function getCurrentMonthRange(referenceDate = new Date()): DateRange {
  return {
    start: startOfMonth(referenceDate),
    end: endOfDay(endOfMonth(referenceDate)),
  };
}

export type BalancePeriod =
  | "today"
  | "week"
  | "fortnight"
  | "month"
  | "24to24"
  | "custom";

export function resolveBalanceDateRange(
  period: BalancePeriod,
  customStart?: string,
  customEnd?: string,
): DateRange & { startDate: string; endDate: string } {
  let range: DateRange;

  switch (period) {
    case "today":
      range = getTodayRange();
      break;
    case "week":
      range = getCurrentWeekRange();
      break;
    case "fortnight":
      range = getCurrentFortnightRange();
      break;
    case "month":
      range = getCurrentMonthRange();
      break;
    case "24to24":
      range = get24To24Range();
      break;
    case "custom":
      range = {
        start: startOfDay(parseISO(customStart ?? format(new Date(), "yyyy-MM-dd"))),
        end: endOfDay(parseISO(customEnd ?? format(new Date(), "yyyy-MM-dd"))),
      };
      break;
    default:
      range = getCurrentMonthRange();
  }

  return {
    ...range,
    startDate: format(range.start, "yyyy-MM-dd"),
    endDate: format(range.end, "yyyy-MM-dd"),
  };
}

export function resolveDashboardDateRange(
  period: DashboardPeriod,
  customStart?: string,
  customEnd?: string,
): DateRange & { startDate: string; endDate: string } {
  let range: DateRange;

  switch (period) {
    case "today":
      range = getTodayRange();
      break;
    case "week":
      range = getCurrentWeekRange();
      break;
    case "fortnight":
      range = getCurrentFortnightRange();
      break;
    case "24to24":
      range = getCurrent24To24Range();
      break;
    case "custom":
      range = {
        start: startOfDay(parseISO(customStart ?? format(new Date(), "yyyy-MM-dd"))),
        end: endOfDay(parseISO(customEnd ?? format(new Date(), "yyyy-MM-dd"))),
      };
      break;
    default:
      range = getCurrentWeekRange();
  }

  return {
    ...range,
    startDate: format(range.start, "yyyy-MM-dd"),
    endDate: format(range.end, "yyyy-MM-dd"),
  };
}

export function formatDateBR(date: string | Date, pattern = "dd/MM/yyyy"): string {
  const value = typeof date === "string" ? parseISO(date) : date;
  return format(value, pattern, { locale: ptBR });
}

/** @deprecated Use formatDateBR */
export function formatDate(date: string | Date, pattern = "dd/MM/yyyy"): string {
  return formatDateBR(date, pattern);
}

export function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (wholeHours === 0 && minutes > 0) {
    return `${minutes}min`;
  }

  if (minutes === 0) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h${minutes.toString().padStart(2, "0")}`;
}

export function formatFileDate(date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export function countDaysInRange(start: Date, end: Date): number {
  return eachDayOfInterval({ start: startOfDay(start), end: startOfDay(end) }).length;
}

export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

/**
 * Retorna as datas úteis (segunda a sexta) dentro do intervalo. Feriados são
 * ignorados nesta versão (SPEC futura).
 */
export function getBusinessDayDates(start: Date, end: Date): Date[] {
  if (end < start) {
    return [];
  }

  return eachDayOfInterval({
    start: startOfDay(start),
    end: startOfDay(end),
  }).filter(isBusinessDay);
}

export function getBusinessDays(start: Date, end: Date): number {
  return getBusinessDayDates(start, end).length;
}

export function eachDayInRange(start: Date, end: Date): Date[] {
  if (end < start) {
    return [];
  }

  return eachDayOfInterval({ start: startOfDay(start), end: startOfDay(end) });
}

/**
 * Formata horas com sinal explícito para saldos: +2h, -2h, +12h30, 0h.
 */
export function formatSignedHours(hours: number): string {
  const rounded = Math.round(hours * 100) / 100;

  if (rounded === 0) {
    return "0h";
  }

  const sign = rounded > 0 ? "+" : "-";
  return `${sign}${formatHours(Math.abs(rounded))}`;
}
