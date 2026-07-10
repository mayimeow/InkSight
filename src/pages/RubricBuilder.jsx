import { useState } from 'react'
import { Plus, Trash2, Lightbulb, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function RubricBuilder() {
  const [title, setTitle] = useState('')
  const [maxScore, setMaxScore] = useState(100)
  const [prompt, setPrompt] = useState('')
  const [guidance, setGuidance] = useState('')
  const [concepts, setConcepts] = useState([
    { id: 1, label: '', points: 0 },
  ])
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | success | error
  const [errorMessage, setErrorMessage] = useState('')

  const addConcept = () => {
    setConcepts([...concepts, { id: Date.now(), label: '', points: 0 }])
  }

  const updateConcept = (id, field, value) => {
    setConcepts(concepts.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const removeConcept = (id) => {
    setConcepts(concepts.filter((c) => c.id !== id))
  }

  const handleSave = async () => {
    setErrorMessage('')

    // Basic validation — don't trust the client blindly
    if (!title.trim()) {
      setErrorMessage('Assignment title is required.')
      setSaveStatus('error')
      return
    }
    if (concepts.some((c) => !c.label.trim())) {
      setErrorMessage('Every rubric concept needs a name.')
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
    })

    if (error) {
      console.error('Supabase insert error:', error)
      setErrorMessage('Could not save rubric. Please try again.')
      setSaveStatus('error')
      return
    }

    setSaveStatus('success')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink-maroon flex items-center gap-2">
            <span className="bg-ink-maroon text-white text-sm w-6 h-6 flex items-center justify-center rounded-full">1</span>
            Rubric Builder
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Define your assignment and grading criteria (The Golden Standard)
          </p>
        </div>
        {saveStatus === 'success' && (
          <span className="hidden md:flex items-center gap-1 text-green-600 text-sm font-medium">
            <CheckCircle2 size={16} /> Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form - spans 2 columns on desktop */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5 md:p-6 space-y-6">
          <div>
            <h2 className="font-semibold text-gray-800 mb-4">Assignment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Grade 10 - Philippine History Essay"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-maroon/40"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Maximum Score</label>
                <input
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-maroon/40"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Essay Prompt / Instructions</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Discuss the causes and effects of..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-maroon/40"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Rubric / Required Concepts</label>
            </div>
            <div className="space-y-2">
              {concepts.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={c.label}
                    onChange={(e) => updateConcept(c.id, 'label', e.target.value)}
                    placeholder="Concept name"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-maroon/40"
                  />
                  <input
                    type="number"
                    value={c.points}
                    onChange={(e) => updateConcept(c.id, 'points', Number(e.target.value))}
                    className="w-16 md:w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ink-maroon/40"
                  />
                  <button
                    onClick={() => removeConcept(c.id)}
                    className="text-red-500 hover:text-red-700 shrink-0"
                    aria-label="Remove concept"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addConcept}
              className="mt-3 flex items-center gap-1 text-sm text-ink-maroon font-medium hover:underline"
            >
              <Plus size={16} /> Add Concept
            </button>
          </div>
        </div>

        {/* Side panel */}
        <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 flex flex-col">
          <h2 className="font-semibold text-gray-800 mb-2">Rubric Guidance (Optional)</h2>
          <p className="text-sm text-gray-500 mb-3">
            Add any specific grading instructions for the AI. Be as specific as possible about what to look for.
          </p>
          <textarea
            value={guidance}
            onChange={(e) => setGuidance(e.target.value)}
            rows={4}
            placeholder="Focus on content and understanding of the historical context. Do not deduct points for grammar or spelling unless it affects clarity."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-ink-maroon/40"
          />
          <div className="flex items-start gap-2 bg-ink-cream border border-ink-gold/30 rounded-lg p-3 text-xs text-gray-600 mb-4">
            <Lightbulb size={16} className="text-ink-gold shrink-0 mt-0.5" />
            The AI will only grade based on the concepts and instructions provided.
          </div>
          <button
            onClick={handleSave}
            className="mt-auto w-full bg-ink-maroon text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-ink-maroon-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' && <Loader2 size={16} className="animate-spin" />}
            {saveStatus === 'saving' ? 'Saving...' : 'Save Rubric'}
          </button>

          {saveStatus === 'error' && (
            <div className="mt-2 flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle size={14} />
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}