import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import EmployeeModal from '../components/EmployeeModal'

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getEmployee, employees, deleteEmployee, user, documents } = useApp()
  const [showModal, setShowModal] = useState(false)

  const employee = id ? getEmployee(id) : null

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500 mb-4">Employee not found</p>
        <Link to="/directory" className="text-stone-900 hover:underline">← Back to Directory</Link>
      </div>
    )
  }

  const manager = employee.manager_id ? employees.find(e => e.id === employee.manager_id) : null
  const directReports = employees.filter(e => e.manager_id === employee.id && e.is_active)
  const employeeDocuments = documents.filter(d => d.employee_id === employee.id)
  const isHRAdmin = user.role === 'hr_admin'

  const handleDeactivate = () => {
    if (confirm('Deactivate this employee?')) {
      deleteEmployee(employee.id)
      navigate('/directory')
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/directory" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
        ← Back
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl font-semibold ${
            employee.is_active ? 'bg-stone-100 text-stone-600' : 'bg-stone-50 text-stone-400'
          }`}>
            {employee.first_name[0]}{employee.last_name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-stone-900">{employee.first_name} {employee.last_name}</h1>
              {!employee.is_active && <span className="px-2 py-0.5 bg-stone-100 text-stone-500 text-xs rounded">Inactive</span>}
            </div>
            <p className="text-stone-500">{employee.position}</p>
            <p className="text-sm text-stone-400">{employee.department} · {employee.employee_id}</p>
          </div>
          <div className="flex gap-2">
            {employee.id !== 'emp-001' && (
              <button 
                onClick={() => navigate(`/messages?to=${employee.id}`)} 
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg"
              >
                Message
              </button>
            )}
            {isHRAdmin && (
              <>
                <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg">
                  Edit
                </button>
                {employee.is_active && (
                  <button onClick={handleDeactivate} className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg">
                    Deactivate
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <Section title="Contact">
            <InfoRow label="Email" value={employee.email} link={`mailto:${employee.email}`} />
            <InfoRow label="Phone" value={employee.phone || '—'} />
            <InfoRow label="Address" value={employee.address || '—'} />
          </Section>

          {/* Employment */}
          <Section title="Employment">
            <InfoRow label="Department" value={employee.department} />
            <InfoRow label="Position" value={employee.position} />
            <InfoRow label="Hire Date" value={new Date(employee.hire_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
            <InfoRow label="Status" value={employee.is_active ? 'Active' : 'Inactive'} />
            {isHRAdmin && (
              <>
                <InfoRow label="Salary" value={`$${employee.salary.toLocaleString()}/year`} />
                <InfoRow label="SSN" value={employee.ssn} />
              </>
            )}
          </Section>

          {/* Documents */}
          {employeeDocuments.length > 0 && (
            <Section title="Documents">
              {employeeDocuments.map(doc => (
                <div key={doc.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-stone-600">{doc.filename}</span>
                  <span className="text-xs text-stone-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </Section>
          )}
        </div>

        <div className="space-y-6">
          {/* Manager */}
          <Section title="Reports To">
            {manager ? (
              <Link to={`/employee/${manager.id}`} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-stone-50">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-medium text-stone-600">
                  {manager.first_name[0]}{manager.last_name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">{manager.first_name} {manager.last_name}</p>
                  <p className="text-xs text-stone-400">{manager.position}</p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-stone-400">No manager</p>
            )}
          </Section>

          {/* Reports */}
          {directReports.length > 0 && (
            <Section title={`Direct Reports (${directReports.length})`}>
              {directReports.map(report => (
                <Link key={report.id} to={`/employee/${report.id}`} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-stone-50">
                  <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-xs font-medium text-stone-600">
                    {report.first_name[0]}{report.last_name[0]}
                  </div>
                  <div>
                    <p className="text-sm text-stone-900">{report.first_name} {report.last_name}</p>
                    <p className="text-xs text-stone-400">{report.position}</p>
                  </div>
                </Link>
              ))}
            </Section>
          )}
        </div>
      </div>

      {showModal && <EmployeeModal employeeId={employee.id} onClose={() => setShowModal(false)} />}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <h2 className="font-medium text-stone-900 mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-sm text-stone-500">{label}</span>
      {link ? (
        <a href={link} className="text-sm text-stone-900 hover:underline">{value}</a>
      ) : (
        <span className="text-sm text-stone-900">{value}</span>
      )}
    </div>
  )
}
