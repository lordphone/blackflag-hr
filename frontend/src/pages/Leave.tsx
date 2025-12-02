import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { LeaveType, LeaveStatus, LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS } from '../types'

export default function Leave() {
  const { user, employees, leaveBalances, leaveRequests, addLeaveRequest, updateLeaveStatus, cancelLeaveRequest } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'balances' | 'requests' | 'team'>('balances')

  const isHRAdmin = user.role === 'hr_admin'
  const currentEmployeeId = 'emp-001'
  const myBalances = leaveBalances.filter(b => b.employee_id === currentEmployeeId)
  const myRequests = leaveRequests.filter(r => r.employee_id === currentEmployeeId)
  const pendingTeamRequests = leaveRequests.filter(r => r.status === 'pending')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Leave</h1>
          <p className="text-stone-500 mt-1">Manage time off</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-lg">
          Request Time Off
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <nav className="flex gap-6">
          {(['balances', 'requests', ...(isHRAdmin ? ['team'] : [])] as ('balances' | 'requests' | 'team')[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab === 'team' ? `Team (${pendingTeamRequests.length})` : tab === 'requests' ? 'My Requests' : 'Balances'}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'balances' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {myBalances.map(balance => {
            const available = balance.accrued + balance.carried_over - balance.used
            const pct = (balance.used / (balance.accrued + balance.carried_over)) * 100
            return (
              <div key={balance.id} className="bg-white rounded-xl border border-stone-200 p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-stone-900">{LEAVE_TYPE_LABELS[balance.leave_type]}</h3>
                  <span className="text-xs text-stone-400">{balance.year}</span>
                </div>
                <p className="text-3xl font-semibold text-stone-900">{available}</p>
                <p className="text-sm text-stone-500 mb-3">days available</p>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-stone-400 rounded-full" style={{ width: `${100 - pct}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-stone-400">
                  <span>Used: {balance.used}</span>
                  <span>Accrued: {balance.accrued}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-stone-200">
          {myRequests.length === 0 ? (
            <div className="text-center py-12 text-stone-500">No requests yet</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {myRequests.map(request => (
                <RequestRow key={request.id} request={request} employees={employees} onCancel={request.status === 'pending' ? () => cancelLeaveRequest(request.id) : undefined} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'team' && isHRAdmin && (
        <div className="bg-white rounded-xl border border-stone-200">
          {pendingTeamRequests.length === 0 ? (
            <div className="text-center py-12 text-stone-500">All caught up!</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {pendingTeamRequests.map(request => {
                const emp = employees.find(e => e.id === request.employee_id)
                return (
                  <div key={request.id} className="p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-xs font-medium text-stone-600">
                      {emp?.first_name[0]}{emp?.last_name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-900">{emp?.first_name} {emp?.last_name}</p>
                      <p className="text-xs text-stone-500">{LEAVE_TYPE_LABELS[request.leave_type]} · {formatDateRange(request.start_date, request.end_date)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateLeaveStatus(request.id, 'approved', currentEmployeeId)} className="px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded">Approve</button>
                      <button onClick={() => updateLeaveStatus(request.id, 'denied', currentEmployeeId)} className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded">Deny</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showModal && <LeaveModal onClose={() => setShowModal(false)} onSubmit={(data) => { addLeaveRequest({ ...data, employee_id: currentEmployeeId }); setShowModal(false) }} />}
    </div>
  )
}

function RequestRow({ request, employees, onCancel }: { request: { id: string; leave_type: LeaveType; start_date: string; end_date: string; hours: number; status: LeaveStatus; approved_by: string | null }; employees: { id: string; first_name: string; last_name: string }[]; onCancel?: () => void }) {
  const approver = request.approved_by ? employees.find(e => e.id === request.approved_by) : null
  const statusColors: Record<LeaveStatus, string> = { pending: 'bg-amber-50 text-amber-700', approved: 'bg-emerald-50 text-emerald-700', denied: 'bg-red-50 text-red-700', cancelled: 'bg-stone-100 text-stone-500' }
  return (
    <div className="p-4 flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[request.status]}`}>{LEAVE_STATUS_LABELS[request.status]}</span>
          <span className="text-xs text-stone-400">{LEAVE_TYPE_LABELS[request.leave_type]}</span>
        </div>
        <p className="text-sm text-stone-900">{formatDateRange(request.start_date, request.end_date)}</p>
        <p className="text-xs text-stone-400">{request.hours / 8} days{approver ? ` · ${request.status === 'approved' ? 'Approved' : 'Reviewed'} by ${approver.first_name}` : ''}</p>
      </div>
      {onCancel && <button onClick={onCancel} className="text-xs text-stone-500 hover:text-red-600">Cancel</button>}
    </div>
  )
}

function LeaveModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: { leave_type: LeaveType; start_date: string; end_date: string; hours: number; notes: string }) => void }) {
  const [leaveType, setLeaveType] = useState<LeaveType>('vacation')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) return
    const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    onSubmit({ leave_type: leaveType, start_date: startDate, end_date: endDate, hours: days * 8, notes })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-5">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Request Time Off</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm">
              {Object.entries(LEAVE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Start</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">End</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required min={startDate} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-stone-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg">Submit</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start), e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return start === end ? s.toLocaleDateString('en-US', { ...opts, year: 'numeric' }) : `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
}
