import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Lightbulb, CheckCircle2, Loader2, AlertCircle, GripVertical } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'

const DRAFT_KEY = 'inksight:rubric-draft'

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function RubricBuilder() {
  const { user } = useAuth()
  const draft = useRef(loadDraft()).current

  const [title, setTitle] = useState(draft?.title || '')
  const [maxScore, setMaxScore] = useState(draft?.maxScore ?? 100)
  const [prompt, setPrompt] = useState(draft?.prompt || '')
  const [guidance, setGuidance] = useState(draft?.guidance || '')
  const [concepts, setConcepts] = useState(draft?.concepts || [{ id: 1, label: '', points: 0 }])
  const [saveStatus, setSaveStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [draftRestored] = useState(!!draft)

  // Auto-save whenever any field changes
  useEffect(() => {
    const hasContent = title || prompt || guidance || concepts.some((c) => c.label)
    if (!hasContent) {
      localStorage.removeItem(DRAFT_KEY)
      return
    }
    const timeout = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, maxScore, prompt, guidance, concepts }))
    }, 400) // small debounce so typing doesn't hammer localStorage
    return () => clearTimeout(timeout)
  }, [title, maxScore, prompt, guidance, concepts])

  const addConcept = () => setConcepts([...concepts, { id: Date.now(), label: '', points: 0 }])
  const updateConcept = (id, field, value) =>
    setConcepts(concepts.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  const removeConcept = (id) => setConcepts(concepts.filter((c) => c.id !== id))

  const allocatedPoints = concepts.reduce((sum, c) => sum + (Number(c.points) || 0), 0)

  const clearDraftAndReset = () => {
    localStorage.removeItem(DRAFT_KEY)
    setTitle('')
    setMaxScore(100)
    setPrompt('')
    setGuidance('')
    setConcepts([{ id: 1, label: '', points: 0 }])
  }

  const handleSave = async () => {
    setErrorMessage('')

    if (!title.trim()) {
      setErrorMessage('Give this assignment a title before saving.')
      setSaveStatus('error')
      return
    }
    if (concepts.some((c) => !c.label.trim())) {
      setErrorMessage('Every rubric concept needs a name.')
      setSaveStatus('error')
      return
    }
    if (!user) {
      setErrorMessage('You must be logged in to save a rubric.')
      setSaveStatus('error')
      return
    }

    setSaveStatus('saving')

    const { error } = await supabase.from('assignments').insert({
      title: title.trim(),
      prompt,
      rubric_guidance: guidance,
      concepts,
      max_score: maxScore,
      teacher_id: user.id,
    })

    if (error) {
      console.error('Supabase insert error:', error)
      setErrorMessage('Could not save the rubric. Please try again.')
      setSaveStatus('error')
      return
    }

    // Rubric saved successfully — the draft is no longer needed
    localStorage.removeItem(DRAFT_KEY)
    setSaveStatus('success')
    setTimeout(() => setSaveStatus('idle'), 2200)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          eyebrow="Assignment Setup"
          title="Rubric Builder"
          subtitle="Define the grading criteria the AI will follow — the golden standard every submission is measured against."
        />
        {saveStatus === 'success' && (
          <span className="hidden md:flex items-center gap-1.5 text-green-700 text-sm font-medium bg-green-50 border border-green-100 rounded-full px-3 py-1.5 shrink-0">
            <CheckCircle2 size={15} /> Saved
          </span>
        )}
      </div>

      {draftRestored && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-100 text-amber-700 text-xs rounded-xl px-4 py-2.5 mb-5">
          <span>Restored an unsaved draft from earlier.</span>
          <button onClick={clearDraftAndReset} className="font-semibold hover:underline shrink-0">
            Discard draft
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-7 space-y-7">
          <div>
            <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Assignment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Assignment Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Grade 10 - Philippine History Essay"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-ink-maroon/10 focus:border-ink-maroon transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Maximum Score
                </label>
                <input
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-ink-maroon/10 focus:border-ink-maroon transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Essay Prompt / Instructions
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Discuss the causes and effects of..."
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-ink-maroon/10 focus:border-ink-maroon transition-all resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Rubric / Required Concepts
              </label>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                allocatedPoints === maxScore ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {allocatedPoints} / {maxScore} pts allocated
              </span>
            </div>
            <div className="space-y-2">
              {concepts.map((c) => (
                <div key={c.id} className="flex items-center gap-2 group">
                  <GripVertical size={16} className="text-gray-300 shrink-0" />
                  <input
                    type="text"
                    value={c.label}
                    onChange={(e) => updateConcept(c.id, 'label', e.target.value)}
                    placeholder="Concept name"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-ink-maroon/10 focus:border-ink-maroon transition-all"
                  />
                  <input
                    type="number"
                    value={c.points}
                    onChange={(e) => updateConcept(c.id, 'points', Number(e.target.value))}
                    className="w-16 md:w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-4 focus:ring-ink-maroon/10 focus:border-ink-maroon transition-all"
                  />
                  <button
                    onClick={() => removeConcept(c.id)}
                    className="text-gray-300 hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove concept"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addConcept}
              className="mt-3 flex items-center gap-1.5 text-sm text-ink-maroon font-medium hover:gap-2 transition-all"
            >
              <Plus size={16} /> Add Concept
            </button>
          </div>
        </div>

        {/* Side panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-7 flex flex-col">
          <h2 className="font-display text-base font-semibold text-gray-900 mb-2">Rubric Guidance</h2>
          <p className="text-xs text-gray-500 mb-3">Optional — tell the AI what to focus on or ignore.</p>
          <textarea
            value={guidance}
            onChange={(e) => setGuidance(e.target.value)}
            rows={4}
            placeholder="Focus on content and understanding of the historical context. Do not deduct points for grammar or spelling unless it affects clarity."
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm mb-4 focus:outline-none focus:ring-4 focus:ring-ink-maroon/10 focus:border-ink-maroon transition-all resize-none"
          />
          <div className="flex items-start gap-2.5 bg-ink-cream border border-ink-gold/25 rounded-xl p-3.5 text-xs text-gray-600 mb-5">
            <Lightbulb size={16} className="text-ink-gold shrink-0 mt-0.5" />
            The AI grades strictly against the concepts and instructions you provide here — nothing else.
          </div>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="mt-auto w-full bg-ink-maroon text-white rounded-xl py-3 text-sm font-semibold hover:bg-ink-maroon-dark hover:shadow-md transition-all disabled:opacity-60 disabled:hover:shadow-none flex items-center justify-center gap-2"
          >
            {saveStatus === 'saving' && <Loader2 size={16} className="animate-spin" />}
            {saveStatus === 'saving' ? 'Saving...' : 'Save Rubric'}
          </button>

          {saveStatus === 'error' && (
            <div className="mt-3 flex items-start gap-2 text-red-600 text-xs bg-red-50 border border-red-100 rounded-lg p-2.5">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}