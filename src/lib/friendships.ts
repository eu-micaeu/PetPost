import { supabase } from './supabase';

/** Situação da amizade entre o usuário logado e outra pessoa. */
export type FriendshipStatus = 'none' | 'friends' | 'sent' | 'received';

type FriendshipRow = { user_id: string; friend_id: string; status: string };

function toStatus(row: FriendshipRow, currentUserId: string): FriendshipStatus {
  if (row.status === 'accepted') return 'friends';
  if (row.status === 'pending') return row.user_id === currentUserId ? 'sent' : 'received';
  return 'none';
}

/** Mapa (id da outra pessoa → status) de todas as relações do usuário logado. */
export async function fetchFriendshipStatuses(currentUserId: string) {
  const { data } = await supabase
    .from('friendships')
    .select('user_id, friend_id, status')
    .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

  const statuses = new Map<string, FriendshipStatus>();
  (data ?? []).forEach((row: FriendshipRow) => {
    const otherId = row.user_id === currentUserId ? row.friend_id : row.user_id;
    const status = toStatus(row, currentUserId);
    // Uma amizade aceita vence qualquer outra linha antiga entre as mesmas pessoas
    if (statuses.get(otherId) !== 'friends') statuses.set(otherId, status);
  });
  return statuses;
}

export async function fetchFriendshipStatus(currentUserId: string, otherUserId: string) {
  const { data } = await supabase
    .from('friendships')
    .select('user_id, friend_id, status')
    .or(
      `and(user_id.eq.${currentUserId},friend_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},friend_id.eq.${currentUserId})`,
    );

  const statuses = (data ?? []).map((row: FriendshipRow) => toStatus(row, currentUserId));
  return (
    statuses.find((s) => s === 'friends') ??
    statuses.find((s) => s !== 'none') ??
    'none'
  ) as FriendshipStatus;
}

/** Envia um pedido de amizade. Retorna uma mensagem de erro amigável, ou null se deu certo. */
export async function sendFriendRequest(currentUserId: string, otherUserId: string) {
  const { error } = await supabase.from('friendships').insert({
    user_id: currentUserId,
    friend_id: otherUserId,
    status: 'pending',
  });
  if (!error) return null;
  return error.message.includes('duplicate') ? 'Você já enviou um pedido para essa pessoa.' : error.message;
}

/** Aceita um pedido recebido. Retorna a mensagem de erro, ou null se deu certo. */
export async function acceptFriendRequest(currentUserId: string, requesterId: string) {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('user_id', requesterId)
    .eq('friend_id', currentUserId)
    .eq('status', 'pending');
  return error?.message ?? null;
}
