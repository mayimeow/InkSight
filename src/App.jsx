import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RubricBuilder from './pages/RubricBuilder'
import IngestionHub from './pages/IngestionHub'
import ProcessingQueue from './pages/ProcessingQueue'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import SystemPerformance from './pages/SystemPerformance'
import Settings from './pages/Settings'
import HelpSupport from './pages/HelpSupport'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
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
  )
}