import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { DEPARTMENTS } from '../types'
import EmployeeModal from '../components/EmployeeModal'

export default function Directory() {
  const { employees, user } = useApp()
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null)

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const searchLower = search.toLowerCase()
      const matchesSearch = !search || 
        emp.first_name.toLowerCase().includes(searchLower) ||
        emp.last_name.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        emp.position.toLowerCase().includes(searchLower)
      const matchesDepartment = departmentFilter === 'all' || emp.department === departmentFilter
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && emp.is_active) ||
        (statusFilter === 'inactive' && !emp.is_active)
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [employees, search, departmentFilter, statusFilter])

  const handleEdit = (id: string) => {
    setEditingEmployee(id)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Directory</h1>
          <p className="text-stone-500 mt-1">{filteredEmployees.length} employees</p>
        </div>
        {user.role === 'hr_admin' && (
          <button
            onClick={() => { setEditingEmployee(null); setShowModal(true) }}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add Employee
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
        >
          <option value="all">All Departments</option>
          {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredEmployees.map(employee => (
          <div key={employee.id} className="bg-white rounded-xl border border-stone-200 p-4 hover:border-stone-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                employee.is_active ? 'bg-stone-100 text-stone-600' : 'bg-stone-50 text-stone-400'
              }`}>
                {employee.first_name[0]}{employee.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link to={`/employee/${employee.id}`} className="font-medium text-stone-900 hover:underline truncate">
                    {employee.first_name} {employee.last_name}
                  </Link>
                  {!employee.is_active && (
                    <span className="px-1.5 py-0.5 bg-stone-100 text-stone-500 text-xs rounded">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-stone-500 truncate">{employee.position}</p>
                <p className="text-sm text-stone-400 truncate">{employee.department}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
              <a href={`mailto:${employee.email}`} className="text-sm text-stone-500 hover:text-stone-700 truncate">
                {employee.email}
              </a>
              {user.role === 'hr_admin' && (
                <button onClick={() => handleEdit(employee.id)} className="text-sm text-stone-400 hover:text-stone-600">
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12 text-stone-500">No employees found</div>
      )}

      {showModal && (
        <EmployeeModal employeeId={editingEmployee} onClose={() => { setShowModal(false); setEditingEmployee(null) }} />
      )}
    </div>
  )
}
