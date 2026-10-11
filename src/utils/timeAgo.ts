export function timeAgo(dateString: string): string {
  if (!dateString) return '';
  const now = Date.now();
  const past = new Date(dateString).getTime();
  if (isNaN(past)) return dateString;

  const diffSeconds = Math.max(0, Math.floor((now - past) / 1000));

  if (diffSeconds < 45) {
    return 'Agora mesmo';
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `há ${diffMinutes} min`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `há ${diffHours}h`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'Ontem';
  }
  if (diffDays < 7) {
    return `há ${diffDays} dias`;
  }
  return new Date(dateString).toLocaleDateString('pt-BR');
}

