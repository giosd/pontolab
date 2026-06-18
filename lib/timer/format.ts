function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/** Formata segundos como HH:MM:SS. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

/** Aplica arredondamento (em minutos) a uma quantidade de segundos. */
export function roundSeconds(seconds: number, roundingMinutes: number): number {
  if (!roundingMinutes || roundingMinutes <= 0) {
    return seconds;
  }

  const increment = roundingMinutes * 60;
  return Math.round(seconds / increment) * increment;
}

/** Converte segundos em horas decimais com 2 casas. */
export function secondsToDecimalHours(seconds: number): number {
  return Math.round((seconds / 3600) * 100) / 100;
}
