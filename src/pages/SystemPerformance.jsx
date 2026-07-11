import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Loader2, Zap, ShieldCheck, Clock, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import PageHeader from '../components/PageHeader'

const ENGINE_COLORS = { groq: '#3b82f6', gemini: '#8b5cf6' }
const STATUS_COLORS = { COMPLETED: '#22c55e', FAILED: '#ef4444', PROCESSING: '#f59e0b', PENDING: '#9ca3af' }

function StatCard({ label, value, sub, icon: Icon, iconClass }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <Icon size={16} className={iconClass} />
      </div>
      <p className="text-2xl font-display font-semibold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function SystemPerformance() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('submissions')
        .select('status, engine_used, latency_ms, token_count, created_at')
        .order('created_at', { ascending: true })

      if (error) setError('Could not load performance data.')
      else setSubmissions(data || [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  const graded = useMemo(
    () => submissions.filter((s) => s.status === 'COMPLETED' && s.latency_ms),
    [submissions]
  )

  const stats = useMemo(() => {
    const total = submissions.length
    const completed = submissions.filter((s) => s.status === 'COMPLETED').length
    const failed = submissions.filter((s) => s.status === 'FAILED').length
    const groqCount = graded.filter((s) => s.engine_used === 'groq').length
    const geminiCount = graded.filter((s) => s.engine_used === 'gemini').length

    const avgLatency = graded.length > 0
      ? Math.round(graded.reduce((sum, s) => sum + s.latency_ms, 0) / graded.length)
      : 0

    const reliabilityRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0'
    const primaryUsageRate = graded.length > 0 ? ((groqCount / graded.length) * 100).toFixed(1) : '0.0'
    const totalTokens = graded.reduce((sum, s) => sum + (s.token_count || 0), 0)

    return { total, completed, failed, groqCount, geminiCount, avgLatency, reliabilityRate, primaryUsageRate, totalTokens }
  }, [submissions, graded])

  const engineBreakdown = useMemo(() => [
    { name: 'Groq (Primary)', value: stats.groqCount },
    { name: 'Gemini (Fallback)', value: stats.geminiCount },
  ].filter((d) => d.value > 0), [stats])

  const statusBreakdown = useMemo(() => {
    const counts = { COMPLETED: 0, FAILED: 0, PROCESSING: 0, PENDING: 0 }
    submissions.forEach((s) => {
      const key = s.status || 'PENDING'
      if (counts[key] !== undefined) counts[key] += 1
    })
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
  }, [submissions])

  const latencyTrend = useMemo(() => {
    const bucketSize = Math.max(1, Math.ceil(graded.length / 15))
    const buckets = []
    for (let i = 0; i < graded.length; i += bucketSize) {
      const chunk = graded.slice(i, i + bucketSize)
      const avg = Math.round(chunk.reduce((sum, s) => sum + s.latency_ms, 0) / chunk.length)
      buckets.push({ label: `#${i + 1}-${i + chunk.length}`, avgLatency: avg })
    }
    return buckets
  }, [graded])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-20 text-gray-400 gap-2 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading system performance data...
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Pipeline Health"
        title="System Performance"
        subtitle="Reliability, grading speed, and AI engine usage across every assignment."
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {stats.total === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
          No submissions processed yet. Grade some essays in the Processing Queue first.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Reliability Rate"
              value={`${stats.reliabilityRate}%`}
              sub={`${stats.completed} of ${stats.total} succeeded`}
              icon={ShieldCheck}
              iconClass="text-green-500"
            />
            <StatCard
              label="Avg Grading Speed"
              value={`${(stats.avgLatency / 1000).toFixed(1)}s`}
              sub="per essay"
              icon={Clock}
              iconClass="text-blue-500"
            />
            <StatCard
              label="Primary Engine Usage"
              value={`${stats.primaryUsageRate}%`}
              sub="handled by Groq"
              icon={Zap}
              iconClass="text-ink-gold"
            />
            <StatCard
              label="Failed Submissions"
              value={stats.failed}
              sub={`~${stats.totalTokens.toLocaleString()} tokens processed`}
              icon={AlertTriangle}
              iconClass="text-red-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Engine Usage (Fail-Safe Wrapper)</h2>
              {engineBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400">No graded submissions yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={engineBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry) => `${entry.value}`}>
                      {engineBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.name.startsWith('Groq') ? ENGINE_COLORS.groq : ENGINE_COLORS.gemini} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {stats.geminiCount > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5 mt-2">
                  Fallback triggered {stats.geminiCount} time{stats.geminiCount !== 1 ? 's' : ''} — redundancy is working as designed.
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Submission Status Breakdown</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry) => `${entry.value}`}>
                    {statusBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#ccc'} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Average Grading Speed Over Time</h2>
            {latencyTrend.length < 2 ? (
              <p className="text-sm text-gray-400">Grade more essays to see a speed trend.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={latencyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="ms" />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgLatency" stroke="#5C0F1A" strokeWidth={2.5} dot={false} name="Avg Latency (ms)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  )
}