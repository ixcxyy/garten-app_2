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
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  creator_id: string | null;
  due_date: string | null;
  created_at: string;
  user_profile?: UserProfile;
}

export interface Label {
  id: string;
  group_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  todo_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
}

export interface TodoComment {
  id: string;
  todo_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_profile?: UserProfile;
}

export interface Poll {
  id: string;
  group_id: string;
  question: string;
  created_by: string | null;
  created_at: string;
  closes_at: string | null;
}

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  created_at: string;
  vote_count?: number;
}

export interface PollVote {
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface TaskAssignee {
  id: string;
  todo_id: string;
  user_id: string;
  created_at: string;
  user_profile?: UserProfile;
}

export interface TaskReaction {
  id: string;
  todo_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
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
