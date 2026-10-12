export function getAgeString(birthDate: string | null): string | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [year, month, day] = birthDate.split('-').map(Number);
  const birth = new Date(year, month - 1, day);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  if (years > 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  if (months > 0) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  return 'Recém-nascido';
}

export function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date <= today
  );
}

/** Converte uma data ISO (AAAA-MM-DD) para exibição em DD/MM/AAAA. */
export function formatBirthDate(isoDate: string | null): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/** Converte DD/MM/AAAA para ISO (AAAA-MM-DD). Retorna null se o formato estiver incompleto. */
export function parseBirthDate(displayDate: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(displayDate);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

/** Converte um Date (no fuso local) para ISO (AAAA-MM-DD). */
export function dateToIso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Converte ISO (AAAA-MM-DD) para Date no fuso local. */
export function isoToDate(isoDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}
