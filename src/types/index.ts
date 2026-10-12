export type TabType = 'home' | 'friends' | 'publish' | 'notifications' | 'pets' | 'settings';

export type PetRecord = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  sex: string | null;
  image_url: string | null;
};

export type PostRecord = {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  nickname: string | null;
  avatar_url?: string | null;
  likes_count?: number;
  is_liked?: boolean;
};

export type FriendshipRequest = {
  id: string;
  user_id: string;
  nickname: string;
};

export type NotificationType = 'like' | 'friend_request' | 'friend_accept';

export type NotificationRecord = {
  id: string;
  user_id: string;
  actor_id: string;
  actor_nickname?: string | null;
  actor_avatar_url?: string | null;
  post_id?: string | null;
  post_image_url?: string | null;
  type: NotificationType;
  created_at: string;
  read: boolean;
};
