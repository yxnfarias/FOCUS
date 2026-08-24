export interface Transaction {
  id?: number
  user_id?: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  created_at?: string
  fitid?: string
  import_job_id?: number
}

export interface ImportJob {
  id?: number
  user_id?: string
  file_name: string
  file_format: 'OFX' | 'CSV'
  status: 'completed' | 'failed'
  total_records: number
  imported_records: number
  duplicated_records: number
  error_message?: string
  created_at?: string
}

export interface Habit {
  id?: number
  user_id?: string
  name: string
  description: string
  color: string
  icon: string
  frequency: 'daily' | 'weekly'
  target_days: number[]
  streak: number
  created_at?: string
}

export interface HabitLog {
  id?: number
  user_id?: string
  habit_id: number
  date: string
  completed: boolean
}

export interface Task {
  id?: number
  user_id?: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  due_date?: string
  project_id?: number
  created_at?: string
}

export interface Project {
  id?: number
  user_id?: string
  name: string
  color: string
  created_at?: string
}

export interface WishItem {
  id?: number
  user_id?: string
  title: string
  description: string
  category: 'purchase' | 'experience' | 'goal' | 'milestone'
  price?: number
  priority: 'low' | 'medium' | 'high'
  target_date?: string
  completed: boolean
  image_url?: string
  created_at?: string
}

export interface DiaryEntry {
  id?: number
  user_id?: string
  date: string
  title: string
  content: string
  mood?: string
  created_at?: string
  updated_at?: string
}

export type InvestmentType = 'stock' | 'fii' | 'etf' | 'bdr' | 'crypto' | 'fixed'

export interface Investment {
  id?: number
  user_id?: string
  ticker: string
  name: string
  type: InvestmentType
  quantity: number
  avg_price: number
  current_price: number
  created_at?: string
  updated_at?: string
}
