export interface Subject {
  id: number;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  post_count?: number;
}

export interface Post {
  id: number;
  user_id: string;
  title: string;
  content: string;
  post_date: string;
  created_at: string;
  updated_at: string;
  subjects?: Subject[];
  subject_ids?: number[];
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
