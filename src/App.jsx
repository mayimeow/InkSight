import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AuthListener from './components/AuthListener'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import ResetPassword from './pages/ResetPassword'
import RubricBuilder from './pages/RubricBuilder'
import IngestionHub from './pages/IngestionHub'
import ProcessingQueue from './pages/ProcessingQueue'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import SystemPerformance from './pages/SystemPerformance'
import Settings from './pages/Settings'
import HelpSupport from './pages/HelpSupport'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthListener />
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<RubricBuilder />} />
            <Route path="/ingestion" element={<IngestionHub />} />
            <Route path="/queue" element={<ProcessingQueue />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/performance" element={<SystemPerformance />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<HelpSupport />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}