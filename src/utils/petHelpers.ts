export function getSpeciesEmoji(species: string): string {
  const s = species.toLowerCase();
  if (s.includes('cachorro') || s.includes('cão') || s.includes('cao')) return '🐶';
  if (s.includes('gato')) return '🐱';
  if (s.includes('ave') || s.includes('pássaro') || s.includes('passaro')) return '🦜';
  if (s.includes('coelho')) return '🐰';
  return '🐾';
}

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
