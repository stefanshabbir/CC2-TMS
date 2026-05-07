export type UserRole = 'admin' | 'trainer' | 'trainee';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role_id?: number; // 1: admin, 2: trainer, 3: trainee
  role?: UserRole; // Mapped for UI convenience
  avatar_url?: string;
  bio?: string;
  created_at?: string;
}

export interface Program {
  id: string;
  title: string;
  short_description: string;
  description: string;
  training_area: string; // Mapped from UI 'category'
  category?: string;     // UI convenience
  start_date: string;
  end_date: string;
  venue: string;
  capacity: number;
  enrolled_count?: number; // Calculated field
  status: 'upcoming' | 'in-progress' | 'completed';
  trainer_id: string;
  trainer_name?: string; // Fetched via join
  trainer_bio?: string;  // Fetched via join
  created_by?: string;
  created_at?: string;
}

export interface Enrollment {
  id: string;
  program_id: string;
  trainee_id: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  enrolled_at: string;
  program?: Program;
}

export interface Resource {
  id: string;
  program_id: string;
  file_name: string; // UI 'title'
  title?: string;    // UI convenience
  description: string;
  file_type: 'pdf' | 'slides' | 'video' | 'document' | 'other';
  file_size: string;
  file_url: string;
  uploaded_by: string;
  uploaded_by_name?: string; // Fetched via join
  uploaded_at: string;
}
