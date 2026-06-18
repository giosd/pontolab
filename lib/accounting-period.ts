import { endOfDay, format, getDate, parseISO, startOfDay } from "date-fns";

import {
  getCurrentFortnightRange,
  getCurrentWeekRange,
  getTodayRange,
  type DateRange,
} from "@/lib/dates";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export interface AccountingPeriod {
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
  label: string;
  month: number;
  year: number;
}

function toIso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Retorna o período de apuração (24→23) que contém o mês/ano informado.
 * `month` é 1-12 e representa o mês que dá nome ao período.
 * Ex.: getAccountingPeriodRange(6, 2026) → 24/05/2026 a 23/06/2026 (Junho/2026).
 */
export function getAccountingPeriodRange(
  month: number,
  year: number,
): AccountingPeriod {
  const monthIndex = month - 1;
  const start = startOfDay(new Date(year, monthIndex - 1, 24));
  const end = endOfDay(new Date(year, monthIndex, 23));

  return {
    start,
    end,
    startDate: toIso(start),
    endDate: toIso(end),
    label: getAccountingPeriodName(start, end),
    month,
    year,
  };
}

/**
 * Período de apuração que contém a data informada.
 * Dia >= 24 pertence ao período do mês seguinte; caso contrário, ao mês atual.
 */
export function getAccountingPeriodByDate(date: Date): AccountingPeriod {
  const day = getDate(date);
  const year = date.getFullYear();
  const monthIndex = date.getMonth();

  if (day >= 24) {
    const nameDate = new Date(year, monthIndex + 1, 1);
    return getAccountingPeriodRange(nameDate.getMonth() + 1, nameDate.getFullYear());
  }

  return getAccountingPeriodRange(monthIndex + 1, year);
}

export function getCurrentAccountingPeriod(referenceDate = new Date()): AccountingPeriod {
  return getAccountingPeriodByDate(referenceDate);
}

export function getPreviousAccountingPeriod(
  referenceDate = new Date(),
): AccountingPeriod {
  const current = getCurrentAccountingPeriod(referenceDate);
  const prevMonth = current.month === 1 ? 12 : current.month - 1;
  const prevYear = current.month === 1 ? current.year - 1 : current.year;
  return getAccountingPeriodRange(prevMonth, prevYear);
}

/** Nome do período baseado no mês/ano da data final (ex.: "Junho/2026"). */
export function getAccountingPeriodName(
  startDate: Date | string,
  endDate: Date | string,
): string {
  const end = typeof endDate === "string" ? parseISO(endDate) : endDate;
  void startDate;
  return `${MONTH_NAMES[end.getMonth()]}/${end.getFullYear()}`;
}

export const REPORT_PERIODS = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "fortnight", label: "Quinzena" },
  { value: "month", label: "Mês" },
  { value: "period_current", label: "24→23 Atual" },
  { value: "period_previous", label: "24→23 Anterior" },
  { value: "custom", label: "Personalizado" },
] as const;

export type ReportPeriodValue = (typeof REPORT_PERIODS)[number]["value"];

export function getReportPeriodLabel(period: string): string {
  return REPORT_PERIODS.find((item) => item.value === period)?.label ?? period;
}

function getCurrentMonthCalendarRange(referenceDate = new Date()): DateRange {
  return {
    start: startOfDay(new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)),
    end: endOfDay(new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0)),
  };
}

export interface ResolvedReportPeriod {
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
  label: string;
}

export function resolveReportDateRange(
  period: ReportPeriodValue,
  customStart?: string,
  customEnd?: string,
): ResolvedReportPeriod {
  let range: DateRange;
  let label = getReportPeriodLabel(period);

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
      range = getCurrentMonthCalendarRange();
      break;
    case "period_current": {
      const accounting = getCurrentAccountingPeriod();
      range = { start: accounting.start, end: accounting.end };
      label = accounting.label;
      break;
    }
    case "period_previous": {
      const accounting = getPreviousAccountingPeriod();
      range = { start: accounting.start, end: accounting.end };
      label = accounting.label;
      break;
    }
    case "custom":
      range = {
        start: startOfDay(parseISO(customStart ?? format(new Date(), "yyyy-MM-dd"))),
        end: endOfDay(parseISO(customEnd ?? format(new Date(), "yyyy-MM-dd"))),
      };
      label = "Personalizado";
      break;
    default:
      range = getCurrentMonthCalendarRange();
  }

  return {
    start: range.start,
    end: range.end,
    startDate: toIso(range.start),
    endDate: toIso(range.end),
    label,
  };
}
