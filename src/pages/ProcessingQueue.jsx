import { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle2, Clock, AlertCircle, PlayCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const CONCURRENCY = 3 // matches your spec's "batches of 2-3 at a time"

function maskName(index) {
  return `Student_${String(index + 1).padStart(2, '0')}`
}

export default function ProcessingQueue() {
  const [assignments, setAssignments] = useState([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [loadingAssignments, setLoadingAssignments] = useState(true)

  const [submissions, setSubmissions] = useState([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAssignments = async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('id, title, prompt, rubric_guidance, concepts, max_score')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setAssignments(data)
        if (data.length > 0) setSelectedAssignmentId(data[0].id)
      }
      setLoadingAssignments(false)
    }
    fetchAssignments()
  }, [])

  const fetchSubmissions = useCallback(async () => {
    if (!selectedAssignmentId) return
    setLoadingSubmissions(true)
    setError('')
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', selectedAssignmentId)
      .order('created_at', { ascending: true })

    if (error) {
      setError('Could not load submissions.')
    } else {
      setSubmissions(data || [])
    }
    setLoadingSubmissions(false)
  }, [selectedAssignmentId])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId)

  const updateLocalStatus = (id, patch) => {
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const gradeOne = async (submission) => {
    updateLocalStatus(submission.id, { status: 'PROCESSING' })

    // PII masking: only the essay content and rubric are sent to the AI.
    // The student's real name never leaves this local state / your Supabase DB.
    const isImage = submission.raw_content?.startsWith('data:image')
    const payload = {
      rubric: {
        prompt: selectedAssignment.prompt,
        max_score: selectedAssignment.max_score,
        rubric_guidance: selectedAssignment.rubric_guidance,
        concepts: selectedAssignment.concepts,
      },
      essayContent: isImage ? '' : submission.raw_content,
      imageBase64: isImage ? submission.raw_content : undefined,
    }

    try {
      const { data, error } = await supabase.functions.invoke('grade-essay', { body: payload })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      const updatePayload = {
        final_score: data.score,
        ai_feedback: { missing_points: data.missing_points, feedback: data.feedback },
        engine_used: data.engine_used,
        latency_ms: data.latency_ms,
        token_count: data.token_count,
        status: 'COMPLETED',
      }

      await supabase.from('submissions').update(updatePayload).eq('id', submission.id)
      updateLocalStatus(submission.id, updatePayload)
    } catch (err) {
      console.error('Grading failed for submission', submission.id, err)
      await supabase.from('submissions').update({ status: 'FAILED' }).eq('id', submission.id)
      updateLocalStatus(submission.id, { status: 'FAILED' })
    }
  }

  const startProcessing = async () => {
    setIsProcessing(true)
    setError('')

    const pending = submissions.filter((s) => s.status === 'PENDING' || !s.status)
    let index = 0

    // Simple concurrency pool — respects the rate-limit queue requirement
    const worker = async () => {
      while (index < pending.length) {
        const current = pending[index]
        index += 1
        await gradeOne(current)
      }
    }

    const workerCount = Math.min(CONCURRENCY, pending.length)
    await Promise.all(Array.from({ length: workerCount }, () => worker()))

    setIsProcessing(false)
  }

  const total = submissions.length
  const completed = submissions.filter((s) => s.status === 'COMPLETED').length
  const failed = submissions.filter((s) => s.status === 'FAILED').length
  const processingCount = submissions.filter((s) => s.status === 'PROCESSING').length
  const pendingCount = submissions.filter((s) => s.status === 'PENDING' || !s.status).length
  const progressPct = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0

  const statusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 size={14} /> Graded</span>
      case 'PROCESSING':
        return <span className="flex items-center gap-1 text-amber-600 text-xs font-medium"><Loader2 size={14} className="animate-spin" /> Processing</span>
      case 'FAILED':
        return <span className="flex items-center gap-1 text-red-600 text-xs font-medium"><AlertCircle size={14} /> Failed</span>
      default:
        return <span className="flex items-center gap-1 text-gray-400 text-xs font-medium"><Clock size={14} /> Pending</span>
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-ink-maroon">Processing Queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          AI is grading essays. You can track progress in real-time.
        </p>
      </div>

      {/* Assignment selector */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Assignment</label>
        {loadingAssignments ? (
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading assignments...
          </p>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-red-500">No assignments found. Create one in Rubric Builder first.</p>
        ) : (
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full md:w-96 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-maroon/40"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">Total Essays</p>
          <p className="text-2xl font-bold text-gray-800">{total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completed}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">Processing</p>
          <p className="text-2xl font-bold text-amber-600">{processingCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-gray-500">{pendingCount}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Overall Progress</p>
          <p className="text-sm text-gray-500">{progressPct}%</p>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-ink-maroon h-2.5 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">{completed + failed} / {total} essays graded</p>
      </div>

      {/* Start button */}
      <button
        onClick={startProcessing}
        disabled={isProcessing || pendingCount === 0}
        className="flex items-center justify-center gap-2 bg-ink-maroon text-white rounded-lg py-2.5 px-5 text-sm font-semibold hover:bg-ink-maroon-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
        {isProcessing
          ? 'Grading in progress...'
          : pendingCount === 0
          ? 'No pending submissions'
          : `Grade ${pendingCount} Pending Submission${pendingCount !== 1 ? 's' : ''}`}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Table */}
      {submissions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 overflow-x-auto">
          <table className="w-full text-sm min-w-175">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4 font-medium">#</th>
                <th className="py-2 pr-4 font-medium">Student (Masked)</th>
                <th className="py-2 pr-4 font-medium">Section</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Engine Used</th>
                <th className="py-2 pr-4 font-medium">Latency</th>
                <th className="py-2 font-medium">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, i) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                  <td className="py-2 pr-4 font-medium text-gray-700">{maskName(i)}</td>
                  <td className="py-2 pr-4">{s.section || '—'}</td>
                  <td className="py-2 pr-4">{statusBadge(s.status)}</td>
                  <td className="py-2 pr-4">
                    {s.engine_used ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.engine_used === 'groq' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {s.engine_used}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-2 pr-4 text-gray-500">
                    {s.latency_ms ? `${(s.latency_ms / 1000).toFixed(1)}s` : '—'}
                  </td>
                  <td className="py-2 text-gray-500">{s.token_count || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loadingSubmissions && submissions.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-sm text-gray-400">
          No submissions yet for this assignment. Upload some in Ingestion Hub first.
        </div>
      )}
    </div>
  )
}