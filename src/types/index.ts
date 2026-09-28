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
};

export type FriendshipRequest = {
  id: string;
  user_id: string;
  nickname: string;
};
