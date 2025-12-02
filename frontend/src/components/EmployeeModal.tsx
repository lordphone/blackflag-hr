import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { DEPARTMENTS, EmployeeFormData } from '../types'

interface EmployeeModalProps {
  employeeId: string | null
  onClose: () => void
}

export default function EmployeeModal({ employeeId, onClose }: EmployeeModalProps) {
  const { employees, addEmployee, updateEmployee, getEmployee } = useApp()
  const isEditing = !!employeeId
  const employee = employeeId ? getEmployee(employeeId) : null

  const [formData, setFormData] = useState<EmployeeFormData>({
    employee_id: '',
    email: '',
    first_name: '',
    last_name: '',
    department: 'Engineering',
    position: '',
    phone: '',
    address: '',
    salary: 0,
    ssn: '',
    manager_id: null,
    hire_date: new Date().toISOString().split('T')[0],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (employee) {
      setFormData({
        employee_id: employee.employee_id,
        email: employee.email,
        first_name: employee.first_name,
        last_name: employee.last_name,
        department: employee.department,
        position: employee.position,
        phone: employee.phone,
        address: employee.address,
        salary: employee.salary,
        ssn: employee.ssn,
        manager_id: employee.manager_id,
        hire_date: employee.hire_date,
      })
    }
  }, [employee])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.first_name.trim()) newErrors.first_name = 'Required'
    if (!formData.last_name.trim()) newErrors.last_name = 'Required'
    if (!formData.email.trim()) newErrors.email = 'Required'
    if (!formData.position.trim()) newErrors.position = 'Required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (isEditing && employeeId) {
      updateEmployee(employeeId, formData)
    } else {
      addEmployee(formData)
    }
    onClose()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === 'salary' ? parseFloat(value) || 0 : value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const managers = employees.filter(emp => emp.is_active && emp.id !== employeeId)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-stone-100 px-5 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900">
              {isEditing ? 'Edit Employee' : 'Add Employee'}
            </h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} error={errors.first_name} />
              <Field label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} error={errors.last_name} />
            </div>
            <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
            <Field label="Phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Department</label>
                <select name="department" value={formData.department} onChange={handleChange}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900">
                  {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
              <Field label="Position" name="position" value={formData.position} onChange={handleChange} error={errors.position} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Manager</label>
                <select name="manager_id" value={formData.manager_id || ''} onChange={(e) => setFormData(prev => ({ ...prev, manager_id: e.target.value || null }))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900">
                  <option value="">None</option>
                  {managers.map(mgr => <option key={mgr.id} value={mgr.id}>{mgr.first_name} {mgr.last_name}</option>)}
                </select>
              </div>
              <Field label="Hire Date" name="hire_date" type="date" value={formData.hire_date} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Salary" name="salary" type="number" value={formData.salary} onChange={handleChange} />
              <Field label="SSN (Last 4)" name="ssn" value={formData.ssn} onChange={handleChange} placeholder="***-**-0000" />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={2}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none" />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-lg">
                {isEditing ? 'Save' : 'Add Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({ label, name, value, onChange, error, type = 'text', placeholder }: {
  label: string; name: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full px-3 py-2 bg-stone-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 ${error ? 'border-red-300' : 'border-stone-200'}`} />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
