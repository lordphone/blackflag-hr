import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  Employee,
  LeaveBalance,
  LeaveRequest,
  Document,
  User,
  EmployeeFormData,
  LeaveStatus,
  DocumentType,
  Message,
} from '../types'
import {
  initialEmployees,
  initialLeaveBalances,
  initialLeaveRequests,
  initialDocuments,
  initialMessages,
  currentUser,
  generateId,
  generateEmployeeId,
} from '../data/mockData'

interface AppContextType {
  // User
  user: User
  isAuthenticated: boolean
  login: (email: string, password: string) => boolean
  logout: () => void

  // Employees
  employees: Employee[]
  addEmployee: (data: EmployeeFormData) => Employee
  updateEmployee: (id: string, data: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
  getEmployee: (id: string) => Employee | undefined

  // Leave
  leaveBalances: LeaveBalance[]
  leaveRequests: LeaveRequest[]
  addLeaveRequest: (data: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'approved_by'>) => LeaveRequest
  updateLeaveStatus: (id: string, status: LeaveStatus, approvedBy?: string) => void
  cancelLeaveRequest: (id: string) => void

  // Documents
  documents: Document[]
  addDocument: (data: { employee_id: string; document_type: DocumentType; filename: string; file_size: number; expiry_date?: string }) => Document
  deleteDocument: (id: string) => void

  // Messages
  messages: Message[]
  sendMessage: (toId: string, content: string) => Message
  markAsRead: (messageIds: string[]) => void
  getConversation: (participantId: string) => Message[]
  getUnreadCount: () => number

  // UI State
  notifications: Notification[]
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void
  clearNotification: (id: string) => void
}

interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const STORAGE_KEY = 'blackflag-hr-data'

interface StoredData {
  employees: Employee[]
  leaveBalances: LeaveBalance[]
  leaveRequests: LeaveRequest[]
  documents: Document[]
  messages: Message[]
  isAuthenticated: boolean
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Load initial state from localStorage or use defaults
  const loadInitialState = (): StoredData => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Handle migration: add missing fields
        return {
          employees: parsed.employees || initialEmployees,
          leaveBalances: parsed.leaveBalances || initialLeaveBalances,
          leaveRequests: parsed.leaveRequests || initialLeaveRequests,
          documents: parsed.documents || initialDocuments,
          messages: parsed.messages || initialMessages,
          isAuthenticated: parsed.isAuthenticated || false,
        }
      }
    } catch (e) {
      console.error('Failed to load stored data:', e)
    }
    return {
      employees: initialEmployees,
      leaveBalances: initialLeaveBalances,
      leaveRequests: initialLeaveRequests,
      documents: initialDocuments,
      messages: initialMessages,
      isAuthenticated: false,
    }
  }

  const initialState = loadInitialState()

  const [employees, setEmployees] = useState<Employee[]>(initialState.employees)
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(initialState.leaveBalances)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialState.leaveRequests)
  const [documents, setDocuments] = useState<Document[]>(initialState.documents)
  const [messages, setMessages] = useState<Message[]>(initialState.messages)
  const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Persist to localStorage
  useEffect(() => {
    const data: StoredData = {
      employees,
      leaveBalances,
      leaveRequests,
      documents,
      messages,
      isAuthenticated,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [employees, leaveBalances, leaveRequests, documents, messages, isAuthenticated])

  // Auth functions
  const login = (email: string, password: string): boolean => {
    // Demo: accept any non-empty credentials
    if (email && password) {
      setIsAuthenticated(true)
      addNotification('Welcome back, ' + currentUser.first_name + '!', 'success')
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    addNotification('You have been signed out.', 'info')
  }

  // Employee functions
  const addEmployee = (data: EmployeeFormData): Employee => {
    const newEmployee: Employee = {
      ...data,
      id: generateId('emp'),
      employee_id: generateEmployeeId(employees),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setEmployees([...employees, newEmployee])
    addNotification(`Employee ${data.first_name} ${data.last_name} added successfully.`, 'success')
    return newEmployee
  }

  const updateEmployee = (id: string, data: Partial<Employee>) => {
    setEmployees(employees.map(emp =>
      emp.id === id
        ? { ...emp, ...data, updated_at: new Date().toISOString() }
        : emp
    ))
    addNotification('Employee updated successfully.', 'success')
  }

  const deleteEmployee = (id: string) => {
    setEmployees(employees.map(emp =>
      emp.id === id
        ? { ...emp, is_active: false, updated_at: new Date().toISOString() }
        : emp
    ))
    addNotification('Employee deactivated.', 'info')
  }

  const getEmployee = (id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id)
  }

  // Leave functions
  const addLeaveRequest = (data: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'approved_by'>): LeaveRequest => {
    const newRequest: LeaveRequest = {
      ...data,
      id: generateId('lr'),
      status: 'pending',
      approved_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setLeaveRequests([...leaveRequests, newRequest])
    addNotification('Leave request submitted.', 'success')
    return newRequest
  }

  const updateLeaveStatus = (id: string, status: LeaveStatus, approvedBy?: string) => {
    setLeaveRequests(leaveRequests.map(req =>
      req.id === id
        ? {
            ...req,
            status,
            approved_by: approvedBy || req.approved_by,
            updated_at: new Date().toISOString(),
          }
        : req
    ))

    // Update leave balance if approved
    if (status === 'approved') {
      const request = leaveRequests.find(r => r.id === id)
      if (request) {
        setLeaveBalances(leaveBalances.map(bal =>
          bal.employee_id === request.employee_id && bal.leave_type === request.leave_type
            ? { ...bal, used: bal.used + (request.hours / 8) }
            : bal
        ))
      }
    }

    addNotification(`Leave request ${status}.`, status === 'approved' ? 'success' : 'info')
  }

  const cancelLeaveRequest = (id: string) => {
    updateLeaveStatus(id, 'cancelled')
  }

  // Document functions
  const addDocument = (data: { employee_id: string; document_type: DocumentType; filename: string; file_size: number; expiry_date?: string }): Document => {
    const newDoc: Document = {
      id: generateId('doc'),
      employee_id: data.employee_id,
      document_type: data.document_type,
      filename: data.filename,
      file_size: data.file_size,
      uploaded_by: currentUser.id,
      expiry_date: data.expiry_date || null,
      created_at: new Date().toISOString(),
    }
    setDocuments([...documents, newDoc])
    addNotification('Document uploaded successfully.', 'success')
    return newDoc
  }

  const deleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id))
    addNotification('Document deleted.', 'info')
  }

  // Message functions
  const sendMessage = (toId: string, content: string): Message => {
    const newMessage: Message = {
      id: generateId('msg'),
      from_id: 'emp-001', // Current user
      to_id: toId,
      content,
      read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, newMessage])
    return newMessage
  }

  const markAsRead = (messageIds: string[]) => {
    setMessages(prev => prev.map(msg =>
      messageIds.includes(msg.id) ? { ...msg, read: true } : msg
    ))
  }

  const getConversation = (participantId: string): Message[] => {
    return messages
      .filter(msg =>
        (msg.from_id === 'emp-001' && msg.to_id === participantId) ||
        (msg.from_id === participantId && msg.to_id === 'emp-001')
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  const getUnreadCount = (): number => {
    return messages.filter(msg => msg.to_id === 'emp-001' && !msg.read).length
  }

  // Notification functions
  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = generateId('notif')
    setNotifications(prev => [...prev, { id, message, type }])
    // Auto-remove after 5 seconds
    setTimeout(() => {
      clearNotification(id)
    }, 5000)
  }

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <AppContext.Provider
      value={{
        user: currentUser,
        isAuthenticated,
        login,
        logout,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        getEmployee,
        leaveBalances,
        leaveRequests,
        addLeaveRequest,
        updateLeaveStatus,
        cancelLeaveRequest,
        documents,
        addDocument,
        deleteDocument,
        messages,
        sendMessage,
        markAsRead,
        getConversation,
        getUnreadCount,
        notifications,
        addNotification,
        clearNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

