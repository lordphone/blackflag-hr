import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Conversation } from '../types'

export default function Messages() {
  const { employees, messages, sendMessage, markAsRead, getConversation } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('to'))
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentUserId = 'emp-001'

  // Build conversations list
  const conversations = useMemo(() => {
    const convMap = new Map<string, Conversation>()
    
    messages.forEach(msg => {
      const otherId = msg.from_id === currentUserId ? msg.to_id : msg.from_id
      const existing = convMap.get(otherId)
      const msgTime = new Date(msg.created_at).getTime()
      
      if (!existing || msgTime > new Date(existing.last_message.created_at).getTime()) {
        const unreadCount = messages.filter(m => 
          m.from_id === otherId && m.to_id === currentUserId && !m.read
        ).length
        convMap.set(otherId, { participant_id: otherId, last_message: msg, unread_count: unreadCount })
      }
    })
    
    return Array.from(convMap.values())
      .sort((a, b) => new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime())
  }, [messages])

  const selectedConversation = selectedId ? getConversation(selectedId) : []
  const selectedEmployee = selectedId ? employees.find(e => e.id === selectedId) : null

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (selectedId) {
      const unreadIds = messages
        .filter(m => m.from_id === selectedId && m.to_id === currentUserId && !m.read)
        .map(m => m.id)
      if (unreadIds.length > 0) markAsRead(unreadIds)
    }
  }, [selectedId, messages, markAsRead])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation.length])

  // Handle URL param
  useEffect(() => {
    const to = searchParams.get('to')
    if (to) setSelectedId(to)
  }, [searchParams])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedId) return
    sendMessage(selectedId, newMessage.trim())
    setNewMessage('')
  }

  const handleSelectConversation = (id: string) => {
    setSelectedId(id)
    setSearchParams({ to: id })
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-semibold text-stone-900 mb-4">Messages</h1>
      
      <div className="bg-white rounded-xl border border-stone-200 h-[calc(100%-3rem)] flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-stone-200 flex flex-col">
          <div className="p-3 border-b border-stone-100">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-sm">No conversations yet</div>
            ) : (
              conversations.map(conv => {
                const emp = employees.find(e => e.id === conv.participant_id)
                if (!emp) return null
                return (
                  <button
                    key={conv.participant_id}
                    onClick={() => handleSelectConversation(conv.participant_id)}
                    className={`w-full p-3 flex items-start gap-3 text-left hover:bg-stone-50 transition-colors ${
                      selectedId === conv.participant_id ? 'bg-stone-50' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-sm font-medium text-stone-600 flex-shrink-0">
                      {emp.first_name[0]}{emp.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${conv.unread_count > 0 ? 'font-semibold text-stone-900' : 'text-stone-900'}`}>
                          {emp.first_name} {emp.last_name}
                        </p>
                        <span className="text-xs text-stone-400 flex-shrink-0">
                          {formatTime(conv.last_message.created_at)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-stone-700' : 'text-stone-400'}`}>
                        {conv.last_message.from_id === currentUserId ? 'You: ' : ''}{conv.last_message.content}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 bg-stone-900 text-white text-xs font-medium rounded-full flex items-center justify-center flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Conversation View */}
        <div className="flex-1 flex flex-col">
          {selectedEmployee ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-stone-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-sm font-medium text-stone-600">
                  {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                </div>
                <div>
                  <p className="font-medium text-stone-900">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                  <p className="text-xs text-stone-400">{selectedEmployee.position}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedConversation.map(msg => {
                  const isMe = msg.from_id === currentUserId
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isMe ? 'order-2' : ''}`}>
                        <div className={`px-4 py-2.5 rounded-2xl ${
                          isMe 
                            ? 'bg-stone-900 text-white rounded-br-md' 
                            : 'bg-stone-100 text-stone-900 rounded-bl-md'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <p className={`text-xs text-stone-400 mt-1 ${isMe ? 'text-right' : ''}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-stone-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-sm font-medium rounded-full transition-colors"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-stone-400">
              <div className="text-center">
                <MessageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a conversation or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  )
}



