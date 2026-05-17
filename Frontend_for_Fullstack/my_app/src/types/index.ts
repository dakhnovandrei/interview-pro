// src/types/index.ts

export type UserRole = 'guest' | 'candidate' | 'interviewer' | 'recruiter' | 'hr' | 'moderator' | 'admin' | 'superadmin';

export interface User {
  user_id: string;
  email: string;
  username: string;
  created_at: string;
  subscription_type: string;
  role?: UserRole;
  is_active?: boolean;
  updated_at?: string;
  photo_url?: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

export interface RegResponse {
  user_id: string;
}

export interface StartInterviewResponse {
  session_id: number;
  message: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export type InterviewSession = {
  session_id: string;
  interview_id?: string;
  interview_type: string;
  job_position: string;
  position?: string;
  company: string;
  created_at: string;
  finished_at?: string;
  status?: string;
  feedback?: string;
};

export type PaginatedInterviews = {
  items: InterviewSession[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export interface InterviewTemplate {
  id: number;
  name?: string;
  job_position: string;
  company?: string;
  interview_type: string;
  owner_id?: number;
  is_template: boolean;
  created_at: string;
  updated_at?: string;
  description?: string;
  questions?: string[];
}

export interface InterviewCreateRequest {
  name?: string;
  job_position: string;
  company?: string;
  interview_type: string;
  is_template?: boolean;
  description?: string;
}
