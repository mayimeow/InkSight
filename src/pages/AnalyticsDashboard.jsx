import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Loader2, TrendingUp, Users, Trophy, TrendingDown, X,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'to', 'of', 'in', 'on', 'at', 'for', 'with', 'as', 'by', 'that', 'this', 'it',
  'from', 'have', 'has', 'had', 'not', 'their', 'they', 'them', 'its', 'which',
  'also', 'these', 'those', 'his', 'her', 'he', 'she', 'we', 'you', 'i', 'about',
  'because', 'so', 'when', 'what', 'how', 'can', 'will', 'would', 'could', 'did',
  'do', 'does', 'was', 'more', 'than', 'into', 'such', 'led', 'due',
])

function extractKeywords(texts, topN = 12) {
  const freq = {}
  texts.forEach((text) => {
    if (!text || text.startsWith('data:image')) return
    const words = text.toLowerCase().match(/[a-z]{4,}/g) || []
    words.forEach((w) => {
      if (STOP_WORDS.has(w)) return
      freq[w] = (freq[w] || 0) + 1
    })
  })
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
}

export default function AnalyticsDashboard() {
  const [assignments, setAssignments] = useState([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [loadingAssignments, setLoadingAssignments] = useState(true)

  const [submissions, setSubmissions] = useState([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [sectionFilter, setSectionFilter] = useState('all')
  const [selectedSubmission, setSelectedSubmission] = useState(null)

  useEffect(() => {
    const fetchAssignments = async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('id, title, max_score, concepts')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setAssignments(data)
        if (data.length > 0) setSelectedAssignmentId(data[0].id)
      }
      setLoadingAssignments(false)
    }
    fetchAssignments()
  }, [])

  useEffect(() => {
    if (!selectedAssignmentId) return
    const fetchSubmissions = async () => {
      setLoadingSubmissions(true)
      setSectionFilter('all')
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', selectedAssignmentId)
        .eq('status', 'COMPLETED')
        .order('final_score', { ascending: false })
      if (!error) setSubmissions(data || [])
      setLoadingSubmissions(false)
    }
    fetchSubmissions()
  }, [selectedAssignmentId])

  const assignment = assignments.find((a) => a.id === selectedAssignmentId)
  const maxScore = assignment?.max_score || 100

  const sections = useMemo(() => {
    const unique = [...new Set(submissions.map((s) => s.section).filter(Boolean))]
    return unique.sort()
  }, [submissions])

  const filtered = useMemo(() => {
    if (sectionFilter === 'all') return submissions
    return submissions.filter((s) => s.section === sectionFilter)
  }, [submissions, sectionFilter])

  const stats = useMemo(() => {
    if (filtered.length === 0) {
      return { avg: 0, passRate: 0, highest: 0, lowest: 0 }
    }
    const scores = filtered.map((s) => s.final_score || 0)
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const passCount = scores.filter((s) => s / maxScore >= 0.6).length
    return {
      avg: avg.toFixed(1),
      passRate: ((passCount / scores.length) * 100).toFixed(1),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
    }
  }, [filtered, maxScore])

  const distributionData = useMemo(() => {
    const buckets = [
      { range: '0-20%', min: 0, max: 0.2, count: 0 },
      { range: '21-40%', min: 0.2, max: 0.4, count: 0 },
      { range: '41-60%', min: 0.4, max: 0.6, count: 0 },
      { range: '61-80%', min: 0.6, max: 0.8, count: 0 },
      { range: '81-100%', min: 0.8, max: 1.01, count: 0 },
    ]
    filtered.forEach((s) => {
      const pct = (s.final_score || 0) / maxScore
      const bucket = buckets.find((b) => pct >= b.min && pct < b.max)
      if (bucket) bucket.count += 1
    })
    return buckets
  }, [filtered, maxScore])

  const gapData = useMemo(() => {
    if (!assignment?.concepts || filtered.length === 0) return []
    return assignment.concepts.map((c) => {
      const missingCount = filtered.filter((s) =>
        s.ai_feedback?.missing_points?.includes(c.label)
      ).length
      return {
        concept: c.label,
        pct: Math.round((missingCount / filtered.length) * 100),
      }
    })
  }, [assignment, filtered])

  const keywords = useMemo(() => {
    return extractKeywords(filtered.map((s) => s.raw_content))
  }, [filtered])

  const maxFreq = keywords.length > 0 ? keywords[0][1] : 1

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink-maroon">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">View results, insights, and class performance</p>
        </div>
      </div>

      {/* Assignment + section selectors */}
      <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Assignment</label>
          {loadingAssignments ? (
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading...
            </p>
          ) : (
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-maroon/40"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-maroon/40"
          >
            <option value="all">All Sections</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
      </div>

      {loadingSubmissions ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading results...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-sm text-gray-400">
          No graded submissions yet. Process some in the Processing Queue first.
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Average Score</p>
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.avg} <span className="text-sm text-gray-400 font-normal">/ {maxScore}</span></p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Pass Rate</p>
                <Users size={16} className="text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.passRate}%</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Highest Score</p>
                <Trophy size={16} className="text-ink-gold" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.highest}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Lowest Score</p>
                <TrendingDown size={16} className="text-red-400" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.lowest}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score distribution */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Score Distribution</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#5C0F1A" radius={[4, 4, 0, 0]} name="# of Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Competency gaps */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Class Mastery Gaps</h2>
              {gapData.length === 0 ? (
                <p className="text-sm text-gray-400">No rubric concepts to analyze.</p>
              ) : (
                <div className="space-y-3">
                  {gapData.map((g) => (
                    <div key={g.concept}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{g.concept}</span>
                        <span>{g.pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-ink-maroon"
                          style={{ width: `${g.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 pt-1">% of class missing concept</p>
                </div>
              )}
            </div>
          </div>

          {/* Word cloud */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Top Keywords (All Essays)</h2>
            {keywords.length === 0 ? (
              <p className="text-sm text-gray-400">No text essays available for keyword analysis.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {keywords.map(([word, count]) => {
                  const size = 12 + (count / maxFreq) * 20
                  return (
                    <span
                      key={word}
                      style={{ fontSize: `${size}px` }}
                      className="text-ink-maroon font-semibold capitalize"
                      title={`${count} mentions`}
                    >
                      {word}
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          {/* Results table */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 overflow-x-auto">
            <h2 className="font-semibold text-gray-800 mb-4">Student Results</h2>
            <table className="w-full text-sm min-w-150">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4 font-medium">Student Name</th>
                  <th className="py-2 pr-4 font-medium">Section</th>
                  <th className="py-2 pr-4 font-medium">Score</th>
                  <th className="py-2 pr-4 font-medium">%</th>
                  <th className="py-2 pr-4 font-medium">Engine</th>
                  <th className="py-2 font-medium">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-700">{s.student_name}</td>
                    <td className="py-2 pr-4">{s.section || '—'}</td>
                    <td className="py-2 pr-4">{s.final_score} / {maxScore}</td>
                    <td className="py-2 pr-4">{Math.round(((s.final_score || 0) / maxScore) * 100)}%</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.engine_used === 'groq' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {s.engine_used || '—'}
                      </span>
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => setSelectedSubmission(s)}
                        className="text-ink-maroon text-xs font-medium hover:underline"
                      >
                        View Feedback
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Feedback modal */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">{selectedSubmission.student_name}</h3>
                <p className="text-xs text-gray-500">
                  {selectedSubmission.section || 'No section'} — Score: {selectedSubmission.final_score} / {maxScore}
                </p>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Missing Concepts</p>
              {selectedSubmission.ai_feedback?.missing_points?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedSubmission.ai_feedback.missing_points.map((mp) => (
                    <span key={mp} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">{mp}</span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-green-600">All required concepts addressed.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">AI Feedback</p>
              <p className="text-sm text-gray-700 bg-ink-cream rounded-lg p-3">
                {selectedSubmission.ai_feedback?.feedback || 'No feedback available.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}