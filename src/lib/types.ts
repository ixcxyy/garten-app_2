export interface Todo {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  photo_url: string | null;
  status: 'pending' | 'completed';
  creator_id: string;
  creator_name: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_at: string;
}
