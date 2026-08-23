import Dexie, { type EntityTable } from 'dexie'

export interface User {
  id?: number
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

export interface Transaction {
  id?: number
  userId: number
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  createdAt: string
  fitid?: string
  importJobId?: number
}

export interface ImportJob {
  id?: number
  userId: number
  fileName: string
  fileFormat: 'OFX' | 'CSV'
  status: 'completed' | 'failed'
  totalRecords: number
  importedRecords: number
  duplicatedRecords: number
  errorMessage?: string
  createdAt: string
}

export interface Habit {
  id?: number
  userId: number
  name: string
  description: string
  color: string
  icon: string
  frequency: 'daily' | 'weekly'
  targetDays: number[]
  streak: number
  createdAt: string
}

export interface HabitLog {
  id?: number
  userId: number
  habitId: number
  date: string
  completed: boolean
}

export interface Task {
  id?: number
  userId: number
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  dueDate?: string
  projectId?: number
  createdAt: string
}

export interface Project {
  id?: number
  userId: number
  name: string
  color: string
  createdAt: string
}

export interface WishItem {
  id?: number
  userId: number
  title: string
  description: string
  category: 'purchase' | 'experience' | 'goal' | 'milestone'
  price?: number
  priority: 'low' | 'medium' | 'high'
  targetDate?: string
  completed: boolean
  imageUrl?: string
  createdAt: string
}

class FocusDB extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>
  importJobs!: EntityTable<ImportJob, 'id'>
  habits!: EntityTable<Habit, 'id'>
  habitLogs!: EntityTable<HabitLog, 'id'>
  tasks!: EntityTable<Task, 'id'>
  projects!: EntityTable<Project, 'id'>
  wishItems!: EntityTable<WishItem, 'id'>
  users!: EntityTable<User, 'id'>

  constructor() {
    super('FocusDB')
    this.version(1).stores({
      transactions: '++id, type, category, date',
      habits: '++id, frequency',
      habitLogs: '++id, habitId, date',
      tasks: '++id, status, priority, dueDate, projectId',
      projects: '++id',
      wishItems: '++id, category, completed',
    })
    this.version(2).stores({
      transactions: '++id, type, category, date, fitid, importJobId',
      importJobs: '++id',
      habits: '++id, frequency',
      habitLogs: '++id, habitId, date',
      tasks: '++id, status, priority, dueDate, projectId',
      projects: '++id',
      wishItems: '++id, category, completed',
    })
    this.version(3).stores({
      transactions: '++id, type, category, date, fitid, importJobId, userId',
      importJobs: '++id, userId',
      habits: '++id, frequency, userId',
      habitLogs: '++id, habitId, date, userId',
      tasks: '++id, status, priority, dueDate, projectId, userId',
      projects: '++id, userId',
      wishItems: '++id, category, completed, userId',
      users: '++id, &email',
    })
  }
}

export const db = new FocusDB()
