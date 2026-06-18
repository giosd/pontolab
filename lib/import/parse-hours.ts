function parseCentesimalDecimal(value: string): number | null {
  const match = value.match(/^(\d+)[.,](\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const hundredths = Number(match[2]);

  return hours + hundredths / 100;
}

function parseTimeColon(value: string): number | null {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (minutes >= 60) {
    return null;
  }

  return hours + minutes / 60;
}

function parseHourMinuteText(value: string): number | null {
  const match = value.match(/^(\d+)\s*h\s*(\d+)?\s*(?:m(?:in)?)?$/i);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;

  if (minutes >= 60) {
    return null;
  }

  return hours + minutes / 60;
}

function parseMinutesText(value: string): number | null {
  const match = value.match(/^(\d+(?:[.,]\d+)?)\s*min$/i);

  if (!match) {
    return null;
  }

  const minutes = Number(match[1].replace(",", "."));

  if (Number.isNaN(minutes)) {
    return null;
  }

  return minutes / 60;
}

export function parseImportedHours(value: unknown): number {
  if (value === null || value === undefined) {
    return Number.NaN;
  }

  const raw = String(value).trim();

  if (!raw) {
    return Number.NaN;
  }

  const normalized = raw.replace(/\s+/g, "");

  const colon = parseTimeColon(normalized);
  if (colon !== null) {
    return roundHours(colon);
  }

  const hourMinute = parseHourMinuteText(normalized);
  if (hourMinute !== null) {
    return roundHours(hourMinute);
  }

  const minutesOnly = parseMinutesText(normalized);
  if (minutesOnly !== null) {
    return roundHours(minutesOnly);
  }

  const centesimal = parseCentesimalDecimal(normalized);
  if (centesimal !== null) {
    return roundHours(centesimal);
  }

  const numeric = Number(normalized.replace(",", "."));

  if (Number.isNaN(numeric)) {
    return Number.NaN;
  }

  return roundHours(numeric);
}

function roundHours(hours: number): number {
  return Math.round(hours * 10000) / 10000;
}

export function isValidImportedHours(hours: number): boolean {
  return !Number.isNaN(hours) && hours > 0 && hours <= 24;
}
