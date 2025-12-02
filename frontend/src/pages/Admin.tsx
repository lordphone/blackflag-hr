import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import EmployeeModal from '../components/EmployeeModal'

export default function Admin() {
  const { employees, leaveRequests, documents, addNotification } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'reports'>('overview')

  const stats = useMemo(() => {
    const active = employees.filter(e => e.is_active)
    const pending = leaveRequests.filter(r => r.status === 'pending')
    const byDept = active.reduce((acc, emp) => { acc[emp.department] = (acc[emp.department] || 0) + 1; return acc }, {} as Record<string, number>)
    const avgSalary = active.length > 0 ? active.reduce((sum, emp) => sum + emp.salary, 0) / active.length : 0
    return { active: active.length, pending: pending.length, byDept, avgSalary, docs: documents.length }
  }, [employees, leaveRequests, documents])

  const handleExport = (type: string) => {
    addNotification(`Exporting ${type}...`, 'info')
    setTimeout(() => addNotification(`${type} downloaded!`, 'success'), 1500)
  }

  const handleReset = () => {
    if (confirm('Reset all demo data?')) {
      localStorage.removeItem('blackflag-hr-data')
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Admin</h1>
          <p className="text-stone-500 mt-1">Manage your organization</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-lg">
          Add Employee
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <nav className="flex gap-6">
          {(['overview', 'employees', 'reports'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-medium border-b-2 capitalize ${activeTab === tab ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Active Employees" value={stats.active} />
            <StatCard label="Pending Requests" value={stats.pending} />
            <StatCard label="Avg. Salary" value={`$${(stats.avgSalary / 1000).toFixed(0)}k`} />
            <StatCard label="Documents" value={stats.docs} />
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="font-medium text-stone-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button onClick={() => setShowModal(true)} className="p-3 bg-stone-50 hover:bg-stone-100 rounded-lg text-left">
                <p className="text-sm font-medium text-stone-900">Add Employee</p>
                <p className="text-xs text-stone-400">Create record</p>
              </button>
              <Link to="/leave" className="p-3 bg-stone-50 hover:bg-stone-100 rounded-lg text-left">
                <p className="text-sm font-medium text-stone-900">Review Leave</p>
                <p className="text-xs text-stone-400">{stats.pending} pending</p>
              </Link>
              <button onClick={() => handleExport('Employee Roster')} className="p-3 bg-stone-50 hover:bg-stone-100 rounded-lg text-left">
                <p className="text-sm font-medium text-stone-900">Export</p>
                <p className="text-xs text-stone-400">Download CSV</p>
              </button>
              <button onClick={handleReset} className="p-3 bg-stone-50 hover:bg-stone-100 rounded-lg text-left">
                <p className="text-sm font-medium text-stone-900">Reset Demo</p>
                <p className="text-xs text-stone-400">Restore defaults</p>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="font-medium text-stone-900 mb-4">By Department</h2>
            <div className="space-y-3">
              {Object.entries(stats.byDept).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
                <div key={dept}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-stone-600">{dept}</span>
                    <span className="text-stone-400">{count}</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-stone-400 rounded-full" style={{ width: `${(count / stats.active) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left text-xs font-medium text-stone-500 uppercase px-4 py-3">Employee</th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase px-4 py-3">Department</th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase px-4 py-3">Salary</th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-medium text-stone-600">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs text-stone-400">{emp.position}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-600">{emp.department}</td>
                  <td className="px-4 py-3 text-sm text-stone-900">${emp.salary.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded ${emp.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/employee/${emp.id}`} className="text-sm text-stone-500 hover:text-stone-900">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Employee Roster', 'Compensation Report', 'Leave Utilization', 'Headcount Trends'].map(report => (
            <button key={report} onClick={() => handleExport(report)} className="flex items-center justify-between p-4 bg-white rounded-xl border border-stone-200 hover:border-stone-300 text-left">
              <div>
                <p className="font-medium text-stone-900">{report}</p>
                <p className="text-sm text-stone-400">Export as CSV</p>
              </div>
              <DownloadIcon className="w-5 h-5 text-stone-400" />
            </button>
          ))}
        </div>
      )}

      {showModal && <EmployeeModal employeeId={null} onClose={() => setShowModal(false)} />}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <p className="text-2xl font-semibold text-stone-900">{value}</p>
      <p className="text-sm text-stone-500 mt-0.5">{label}</p>
    </div>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}
