export interface UserProfile {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  owner_id: string | null;
  invite_code: string;
  created_at: string;
}

export interface GroupMember {
  user_id: string;
  group_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  user_profile?: UserProfile;
}

export interface Todo {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  photo_url: string | null;
  status: 'pending' | 'completed';
  creator_id: string | null;
  created_at: string;
  user_profile?: UserProfile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'info' | 'invite' | 'success' | 'warning';
  is_read: boolean;
  created_at: string;
}
