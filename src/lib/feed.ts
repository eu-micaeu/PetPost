import { supabase } from './supabase';
import type { PostRecord } from '../types';

export const FEED_PAGE_SIZE = 10;

export type FeedPage = {
  posts: PostRecord[];
  hasMore: boolean;
};

// Vira true quando o banco ainda não tem a função get_feed; a partir daí usamos o fallback.
let rpcUnavailable = false;

/**
 * Busca uma página do feed (posts do usuário + amigos), do mais novo para o mais antigo.
 * `before` é o created_at do último post já carregado (paginação por cursor).
 */
export async function fetchFeedPage(currentUserId: string, before?: string): Promise<FeedPage> {
  if (!rpcUnavailable) {
    const { data, error } = await supabase.rpc('get_feed', {
      p_limit: FEED_PAGE_SIZE,
      p_before: before ?? null,
    });

    if (!error) {
      const posts = ((data ?? []) as PostRecord[]).map((post) => ({
        ...post,
        likes_count: Number(post.likes_count ?? 0),
        is_liked: Boolean(post.is_liked),
      }));
      return { posts, hasMore: posts.length === FEED_PAGE_SIZE };
    }

    // PGRST202: função não encontrada no schema → SQL ainda não foi aplicado.
    if (error.code !== 'PGRST202') throw error;
    rpcUnavailable = true;
  }

  return fetchFeedPageFallback(currentUserId, before);
}

async function fetchFeedPageFallback(currentUserId: string, before?: string): Promise<FeedPage> {
  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .eq('status', 'accepted')
    .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

  const authorIds = new Set<string>([currentUserId]);
  friendships?.forEach((friendship) => {
    authorIds.add(friendship.user_id === currentUserId ? friendship.friend_id : friendship.user_id);
  });

  let query = supabase
    .from('posts')
    .select('id, user_id, image_url, created_at')
    .in('user_id', Array.from(authorIds))
    .order('created_at', { ascending: false })
    .limit(FEED_PAGE_SIZE);
  if (before) query = query.lt('created_at', before);

  const { data: pagePosts, error } = await query;
  if (error) throw error;

  const posts = pagePosts ?? [];
  if (posts.length === 0) return { posts: [], hasMore: false };

  const profileIds = Array.from(new Set(posts.map((post) => post.user_id)));
  const postIds = posts.map((post) => post.id);

  const [profilesRes, likesRes] = await Promise.all([
    supabase.from('profiles').select('id, nickname, avatar_url').in('id', profileIds),
    supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map((profile) => [profile.id, profile]));
  const likesCountMap = new Map<string, number>();
  const userLikedSet = new Set<string>();
  (likesRes.data ?? []).forEach((like) => {
    likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) ?? 0) + 1);
    if (like.user_id === currentUserId) userLikedSet.add(like.post_id);
  });

  return {
    posts: posts.map((post) => ({
      ...post,
      nickname: profileMap.get(post.user_id)?.nickname ?? null,
      avatar_url: profileMap.get(post.user_id)?.avatar_url ?? null,
      likes_count: likesCountMap.get(post.id) ?? 0,
      is_liked: userLikedSet.has(post.id),
    })),
    hasMore: posts.length === FEED_PAGE_SIZE,
  };
}

/**
 * Junta uma primeira página recém-buscada com o que já estava carregado,
 * preservando as páginas mais antigas que o usuário já rolou.
 */
export function mergeFirstPage(current: PostRecord[], fresh: PostRecord[]): PostRecord[] {
  if (fresh.length === 0) return [];
  const oldestFresh = fresh[fresh.length - 1].created_at;
  const older = current.filter((post) => post.created_at < oldestFresh);
  return [...fresh, ...older];
}
