import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Profile() {
  const { user, employees, updateEmployee, leaveBalances, documents } = useApp()
  const employee = employees.find(e => e.employee_id === user.employee_id)
  const myBalances = leaveBalances.filter(b => b.employee_id === employee?.id)
  const myDocuments = documents.filter(d => d.employee_id === employee?.id)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ phone: employee?.phone || '', address: employee?.address || '' })

  if (!employee) return <div className="text-center py-12 text-stone-500">Profile not found</div>

  const handleSave = () => {
    updateEmployee(employee.id, formData)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-stone-100 flex items-center justify-center text-xl font-semibold text-stone-600">
            {employee.first_name[0]}{employee.last_name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-stone-900">{employee.first_name} {employee.last_name}</h1>
            <p className="text-stone-500">{employee.position}</p>
            <p className="text-sm text-stone-400">{employee.department}</p>
          </div>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50">
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-stone-900">Contact</h2>
              {isEditing && (
                <div className="flex gap-2">
                  <button onClick={() => { setFormData({ phone: employee.phone, address: employee.address }); setIsEditing(false) }} className="text-sm text-stone-500">Cancel</button>
                  <button onClick={handleSave} className="text-sm text-stone-900 font-medium">Save</button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-stone-500 mb-1">Email</p>
                <p className="text-stone-900">{employee.email}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500 mb-1">Phone</p>
                {isEditing ? (
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm" />
                ) : (
                  <p className="text-stone-900">{employee.phone || '—'}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-stone-500 mb-1">Address</p>
                {isEditing ? (
                  <textarea value={formData.address} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} rows={2} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm resize-none" />
                ) : (
                  <p className="text-stone-900">{employee.address || '—'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Employment */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="font-medium text-stone-900 mb-4">Employment</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-stone-500">Department</p><p className="text-stone-900">{employee.department}</p></div>
              <div><p className="text-sm text-stone-500">Position</p><p className="text-stone-900">{employee.position}</p></div>
              <div><p className="text-sm text-stone-500">Hire Date</p><p className="text-stone-900">{new Date(employee.hire_date).toLocaleDateString()}</p></div>
              <div><p className="text-sm text-stone-500">Employee ID</p><p className="text-stone-900">{employee.employee_id}</p></div>
            </div>
          </div>

          {/* Documents */}
          {myDocuments.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h2 className="font-medium text-stone-900 mb-4">Documents</h2>
              <div className="space-y-2">
                {myDocuments.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between py-2">
                    <span className="text-sm text-stone-600">{doc.filename}</span>
                    <span className="text-xs text-stone-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Leave */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="font-medium text-stone-900 mb-4">Leave Balances</h2>
            <div className="space-y-3">
              {myBalances.map(balance => {
                const available = balance.accrued + balance.carried_over - balance.used
                return (
                  <div key={balance.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-stone-600 capitalize">{balance.leave_type.replace('_', ' ')}</span>
                      <span className="text-stone-900 font-medium">{available}d</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-stone-400 rounded-full" style={{ width: `${(available / (balance.accrued + balance.carried_over)) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="font-medium text-stone-900 mb-4">Quick Info</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Tenure</span>
                <span className="text-stone-900">{Math.floor((Date.now() - new Date(employee.hire_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}y</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Documents</span>
                <span className="text-stone-900">{myDocuments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Status</span>
                <span className="text-emerald-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
