// Employee types
export interface Employee {
  id: string
  employee_id: string
  email: string
  first_name: string
  last_name: string
  department: string
  position: string
  phone: string
  address: string
  salary: number
  ssn: string
  manager_id: string | null
  is_active: boolean
  hire_date: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface EmployeeFormData {
  employee_id: string
  email: string
  first_name: string
  last_name: string
  department: string
  position: string
  phone: string
  address: string
  salary: number
  ssn: string
  manager_id: string | null
  hire_date: string
}

// Leave types
export type LeaveType = 'vacation' | 'sick' | 'personal' | 'bereavement' | 'jury_duty' | 'parental'
export type LeaveStatus = 'pending' | 'approved' | 'denied' | 'cancelled'

export interface LeaveBalance {
  id: string
  employee_id: string
  leave_type: LeaveType
  year: number
  accrued: number
  used: number
  carried_over: number
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  hours: number
  status: LeaveStatus
  notes: string
  approved_by: string | null
  created_at: string
  updated_at: string
}

// Document types
export type DocumentType = 'id' | 'certification' | 'offer_letter' | 'tax_form' | 'contract' | 'other'

export interface Document {
  id: string
  employee_id: string
  document_type: DocumentType
  filename: string
  file_size: number
  uploaded_by: string
  expiry_date: string | null
  created_at: string
}

// User/Auth types
export type UserRole = 'employee' | 'manager' | 'hr_admin'

export interface User {
  id: string
  employee_id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  avatar_url?: string
}

// Department type
export const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Sales',
  'Marketing',
  'Finance',
  'Operations',
  'Legal',
  'Customer Support',
] as const

export type Department = typeof DEPARTMENTS[number]

// Leave type labels
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  vacation: 'Vacation/PTO',
  sick: 'Sick Leave',
  personal: 'Personal Day',
  bereavement: 'Bereavement',
  jury_duty: 'Jury Duty',
  parental: 'Parental Leave',
}

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
  cancelled: 'Cancelled',
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  id: 'ID Document',
  certification: 'Certification',
  offer_letter: 'Offer Letter',
  tax_form: 'Tax Form',
  contract: 'Contract',
  other: 'Other',
}

