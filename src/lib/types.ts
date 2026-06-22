export interface Student {
  id: string
  student_id: string
  name: string
  line_id: string | null
  phone: string | null
  major: string | null
  company: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
}

export interface Consultation {
  id: string
  student_id: string
  date: string
  duration_minutes: number | null
  note: string | null
  created_at: string
}

export interface MeetingNote {
  id: string
  student_id: string
  date: string
  title: string
  content: string
  created_at: string
}

export interface Milestone {
  id: string
  student_id: string
  title: string
  description: string | null
  due_date: string | null
  completed_at: string | null
  sort_order: number
  created_at: string
}

export interface ProgressNote {
  id: string
  student_id: string
  date: string
  content: string
  created_at: string
}

export interface FileUpload {
  id: string
  student_id: string
  filename: string
  storage_path: string
  file_size: number | null
  uploaded_at: string
}

export interface StudentWithStats extends Student {
  last_consultation?: string | null
  consultation_count?: number
  milestone_total?: number
  milestone_done?: number
}
