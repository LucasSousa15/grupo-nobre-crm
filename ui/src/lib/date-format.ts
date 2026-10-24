/** Formats calendar dates without applying the browser timezone. */
export function formatCivilDate(value: string | null, fallback = 'NÃ£o informado'): string {
  if (!value) return fallback;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return fallback;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export function toCivilDateInput(value: string | null): string {
  return value?.slice(0, 10) ?? '';
}

export function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
