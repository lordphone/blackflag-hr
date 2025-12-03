import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Layout from './components/Layout'
import NewSignIn from './pages/NewSignIn'
import NewDashboard from './pages/NewDashboard'
import Directory from './pages/Directory'
import EmployeeDetail from './pages/EmployeeDetail'
import Profile from './pages/Profile'
import Leave from './pages/Leave'
import Documents from './pages/Documents'
import Messages from './pages/Messages'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp()
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  return <Layout>{children}</Layout>
}

// Public route that redirects if authenticated
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp()
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        <PublicRoute>
          <NewSignIn />
        </PublicRoute>
      } />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <NewDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/directory" element={
        <ProtectedRoute>
          <Directory />
        </ProtectedRoute>
      } />
      
      <Route path="/employee/:id" element={
        <ProtectedRoute>
          <EmployeeDetail />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      
      <Route path="/leave" element={
        <ProtectedRoute>
          <Leave />
        </ProtectedRoute>
      } />
      
      <Route path="/documents" element={
        <ProtectedRoute>
          <Documents />
        </ProtectedRoute>
      } />
      
      <Route path="/messages" element={
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      } />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </Router>
  )
}

export default App
