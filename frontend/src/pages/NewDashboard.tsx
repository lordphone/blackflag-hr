import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { LEAVE_TYPE_LABELS } from '../types'

export default function NewDashboard() {
  const { user, employees, leaveRequests, leaveBalances, documents } = useApp()
  const isHRAdmin = user.role === 'hr_admin'

  const stats = useMemo(() => {
    const activeEmployees = employees.filter(e => e.is_active)
    const pendingLeave = leaveRequests.filter(r => r.status === 'pending')
    const recentHires = employees.filter(e => {
      const hireDate = new Date(e.hire_date)
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      return hireDate > threeMonthsAgo && e.is_active
    })

    const byDepartment = activeEmployees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalEmployees: activeEmployees.length,
      pendingLeaveCount: pendingLeave.length,
      recentHiresCount: recentHires.length,
      byDepartment,
    }
  }, [employees, leaveRequests])

  const myBalances = leaveBalances.filter(b => b.employee_id === 'emp-001')
  const pendingTeamRequests = leaveRequests.filter(r => r.status === 'pending').slice(0, 4)
  const recentEmployees = [...employees]
    .filter(e => e.is_active)
    .sort((a, b) => new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Welcome back, {user.first_name}</h1>
        <p className="text-stone-500 mt-1">Here's what's happening today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Employees" value={stats.totalEmployees} />
        <StatCard label="Pending Leave" value={stats.pendingLeaveCount} highlight={stats.pendingLeaveCount > 0} />
        <StatCard label="New Hires" value={stats.recentHiresCount} sublabel="last 90 days" />
        <StatCard label="Documents" value={documents.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leave Balances */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-stone-900">My Leave</h2>
              <Link to="/leave" className="text-sm text-stone-500 hover:text-stone-700">View all →</Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {myBalances.map(balance => {
                const available = balance.accrued + balance.carried_over - balance.used
                return (
                  <div key={balance.id} className="bg-stone-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-semibold text-stone-900">{available}</p>
                    <p className="text-xs text-stone-500 capitalize mt-0.5">
                      {balance.leave_type.replace('_', ' ')}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pending Approvals */}
          {isHRAdmin && pendingTeamRequests.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-stone-900">Pending Approvals</h2>
                <Link to="/leave" className="text-sm text-stone-500 hover:text-stone-700">View all →</Link>
              </div>
              <div className="space-y-3">
                {pendingTeamRequests.map(request => {
                  const employee = employees.find(e => e.id === request.employee_id)
                  return (
                    <div key={request.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-600">
                        {employee?.first_name[0]}{employee?.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate">
                          {employee?.first_name} {employee?.last_name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {LEAVE_TYPE_LABELS[request.leave_type]} · {request.hours / 8}d
                        </p>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                        Pending
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Departments */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="font-medium text-stone-900 mb-4">Team by Department</h2>
            <div className="space-y-3">
              {Object.entries(stats.byDepartment)
                .sort((a, b) => b[1] - a[1])
                .map(([dept, count]) => {
                  const pct = (count / stats.totalEmployees) * 100
                  return (
                    <div key={dept}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-stone-600">{dept}</span>
                        <span className="text-stone-400">{count}</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-stone-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="font-medium text-stone-900 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/leave" className="flex items-center gap-3 p-2.5 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors">
                <CalendarIcon className="w-4 h-4 text-stone-400" />
                <span className="text-sm text-stone-700">Request Time Off</span>
              </Link>
              <Link to="/directory" className="flex items-center gap-3 p-2.5 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors">
                <UsersIcon className="w-4 h-4 text-stone-400" />
                <span className="text-sm text-stone-700">Browse Directory</span>
              </Link>
              <Link to="/documents" className="flex items-center gap-3 p-2.5 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors">
                <DocumentIcon className="w-4 h-4 text-stone-400" />
                <span className="text-sm text-stone-700">Upload Document</span>
              </Link>
            </div>
          </div>

          {/* Recent */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-stone-900">Recent Hires</h2>
              <Link to="/directory" className="text-sm text-stone-500 hover:text-stone-700">View all →</Link>
            </div>
            <div className="space-y-2">
              {recentEmployees.map(emp => (
                <Link
                  key={emp.id}
                  to={`/employee/${emp.id}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-600">
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-900 truncate">{emp.first_name} {emp.last_name}</p>
                    <p className="text-xs text-stone-400 truncate">{emp.position}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sublabel, highlight }: { label: string; value: number; sublabel?: string; highlight?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <p className="text-2xl font-semibold text-stone-900">{value}</p>
      <p className="text-sm text-stone-500 mt-0.5">{label}</p>
      {sublabel && <p className="text-xs text-stone-400">{sublabel}</p>}
      {highlight && <div className="mt-2 h-0.5 w-8 bg-amber-400 rounded" />}
    </div>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}
