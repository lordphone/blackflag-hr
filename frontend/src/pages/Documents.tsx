import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { DocumentType, DOCUMENT_TYPE_LABELS } from '../types'

export default function Documents() {
  const { user, documents, employees, addDocument, deleteDocument } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<DocumentType | 'all'>('all')

  const isHRAdmin = user.role === 'hr_admin'
  const currentEmployeeId = 'emp-001'
  const visibleDocs = isHRAdmin ? documents : documents.filter(d => d.employee_id === currentEmployeeId)
  const filteredDocs = filter === 'all' ? visibleDocs : visibleDocs.filter(d => d.document_type === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Documents</h1>
          <p className="text-stone-500 mt-1">{filteredDocs.length} files</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-lg">
          Upload
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', ...Object.keys(DOCUMENT_TYPE_LABELS)].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type as DocumentType | 'all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === type ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}
          >
            {type === 'all' ? 'All' : DOCUMENT_TYPE_LABELS[type as DocumentType]}
          </button>
        ))}
      </div>

      {filteredDocs.length === 0 ? (
        <div className="text-center py-12 text-stone-500">No documents</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => {
            const emp = employees.find(e => e.id === doc.employee_id)
            return (
              <div key={doc.id} className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
                    <FileIcon className="w-5 h-5 text-stone-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{doc.filename}</p>
                    <p className="text-xs text-stone-400">{DOCUMENT_TYPE_LABELS[doc.document_type]}</p>
                  </div>
                </div>
                <div className="text-xs text-stone-400 space-y-1">
                  {isHRAdmin && emp && <p>{emp.first_name} {emp.last_name}</p>}
                  <p>{(doc.file_size / 1024).toFixed(0)} KB · {new Date(doc.created_at).toLocaleDateString()}</p>
                  {doc.expiry_date && (
                    <p className={new Date(doc.expiry_date) < new Date() ? 'text-red-500' : ''}>
                      Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-stone-100 flex gap-2">
                  <button className="flex-1 py-1.5 text-xs text-stone-600 bg-stone-50 hover:bg-stone-100 rounded-lg">Download</button>
                  <button onClick={() => { if (confirm('Delete?')) deleteDocument(doc.id) }} className="py-1.5 px-2 text-xs text-red-600 hover:bg-red-50 rounded-lg">Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <UploadModal isHRAdmin={isHRAdmin} employees={employees} currentEmployeeId={currentEmployeeId} onClose={() => setShowModal(false)} onUpload={(data) => { addDocument(data); setShowModal(false) }} />}
    </div>
  )
}

function UploadModal({ isHRAdmin, employees, currentEmployeeId, onClose, onUpload }: { isHRAdmin: boolean; employees: { id: string; first_name: string; last_name: string; is_active: boolean }[]; currentEmployeeId: string; onClose: () => void; onUpload: (data: { employee_id: string; document_type: DocumentType; filename: string; file_size: number; expiry_date?: string }) => void }) {
  const [employeeId, setEmployeeId] = useState(currentEmployeeId)
  const [documentType, setDocumentType] = useState<DocumentType>('other')
  const [filename, setFilename] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [expiryDate, setExpiryDate] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => { setFilename(file.name); setFileSize(file.size) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-5">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Upload Document</h2>
        <form onSubmit={(e) => { e.preventDefault(); if (filename) onUpload({ employee_id: employeeId, document_type: documentType, filename, file_size: fileSize, expiry_date: expiryDate || undefined }) }} className="space-y-4">
          <div
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${filename ? 'border-stone-300 bg-stone-50' : 'border-stone-200 hover:border-stone-300'}`}
          >
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {filename ? (
              <p className="text-sm text-stone-900">{filename} <span className="text-stone-400">({(fileSize / 1024).toFixed(0)} KB)</span></p>
            ) : (
              <p className="text-sm text-stone-500">Click to select file</p>
            )}
          </div>
          {isHRAdmin && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Employee</label>
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm">
                {employees.filter(e => e.is_active).map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentType)} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm">
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Expiry Date (optional)</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-stone-600">Cancel</button>
            <button type="submit" disabled={!filename} className="px-4 py-2 bg-stone-900 disabled:bg-stone-300 text-white text-sm font-medium rounded-lg">Upload</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}
