import { useState, useEffect, useCallback } from 'react'
import Papa from 'papaparse'
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

function AlertBox({ type, children }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-600',
    success: 'bg-green-50 border-green-200 text-green-700',
  }
  const Icon = type === 'error' ? AlertCircle : CheckCircle2

  return (
    <div className={`flex items-start gap-2 text-sm border rounded-lg p-3 ${styles[type]}`}>
      <Icon size={16} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  )
}

export default function IngestionHub() {
  const [mode, setMode] = useState('csv') // 'csv' | 'photos'

  // Assignments dropdown
  const [assignments, setAssignments] = useState([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [loadingAssignments, setLoadingAssignments] = useState(true)

  // CSV state
  const [csvFileName, setCsvFileName] = useState('')
  const [parsedRows, setParsedRows] = useState([])
  const [csvError, setCsvError] = useState('')

  // Photo state
  const [photoEntries, setPhotoEntries] = useState([]) // { id, file, previewUrl, studentName, section }
  const [isDragging, setIsDragging] = useState(false)

  // Submit state
  const [submitStatus, setSubmitStatus] = useState('idle') // idle | submitting | success | error
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    const fetchAssignments = async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('id, title')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setAssignments(data)
        if (data.length > 0) setSelectedAssignmentId(data[0].id)
      }
      setLoadingAssignments(false)
    }
    fetchAssignments()
  }, [])

  // ---------- CSV handling ----------
  const handleCsvFile = (file) => {
    if (!file) return
    setCsvError('')
    setCsvFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const requiredCols = ['student_name', 'section', 'essay_content']
        const cols = results.meta.fields || []
        const missing = requiredCols.filter((c) => !cols.includes(c))

        if (missing.length > 0) {
          setCsvError(`CSV is missing required column(s): ${missing.join(', ')}`)
          setParsedRows([])
          return
        }

        const cleaned = results.data
          .filter((row) => row.student_name?.trim() && row.essay_content?.trim())
          .map((row) => ({
            student_name: row.student_name.trim(),
            section: row.section?.trim() || '',
            essay_content: row.essay_content.trim(),
          }))

        if (cleaned.length === 0) {
          setCsvError('No valid rows found. Check that student_name and essay_content are filled in.')
        }
        setParsedRows(cleaned)
      },
      error: (err) => {
        setCsvError(`Could not parse CSV: ${err.message}`)
      },
    })
  }

  // ---------- Photo handling ----------
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const addPhotos = async (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    const newEntries = await Promise.all(
      files.map(async (file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        previewUrl: await fileToBase64(file),
        studentName: '',
        section: '',
      }))
    )
    setPhotoEntries((prev) => [...prev, ...newEntries])
  }

  const updatePhotoEntry = (id, field, value) => {
    setPhotoEntries((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  const removePhotoEntry = (id) => {
    setPhotoEntries((prev) => prev.filter((p) => p.id !== id))
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    if (mode === 'csv') {
      handleCsvFile(e.dataTransfer.files[0])
    } else {
      addPhotos(e.dataTransfer.files)
    }
  }, [mode])

  // ---------- Submit to Supabase ----------
  const handleSubmit = async () => {
    setSubmitError('')

    if (!selectedAssignmentId) {
      setSubmitError('Please select an assignment first.')
      setSubmitStatus('error')
      return
    }

    let rowsToInsert = []

    if (mode === 'csv') {
      if (parsedRows.length === 0) {
        setSubmitError('Upload a valid CSV before submitting.')
        setSubmitStatus('error')
        return
      }
      rowsToInsert = parsedRows.map((r) => ({
        assignment_id: selectedAssignmentId,
        student_name: r.student_name,
        section: r.section,
        raw_content: r.essay_content,
        status: 'PENDING',
      }))
    } else {
      if (photoEntries.length === 0) {
        setSubmitError('Add at least one photo before submitting.')
        setSubmitStatus('error')
        return
      }
      if (photoEntries.some((p) => !p.studentName.trim())) {
        setSubmitError('Every photo needs a student name.')
        setSubmitStatus('error')
        return
      }
      rowsToInsert = photoEntries.map((p) => ({
        assignment_id: selectedAssignmentId,
        student_name: p.studentName.trim(),
        section: p.section.trim(),
        raw_content: p.previewUrl,
        status: 'PENDING',
      }))
    }

    setSubmitStatus('submitting')

    const { error } = await supabase.from('submissions').insert(rowsToInsert)

    if (error) {
      console.error('Submission insert error:', error)
      setSubmitError('Could not upload submissions. Please try again.')
      setSubmitStatus('error')
      return
    }

    setSubmitStatus('success')
    setParsedRows([])
    setCsvFileName('')
    setPhotoEntries([])
    setTimeout(() => setSubmitStatus('idle'), 2500)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-ink-maroon flex items-center gap-2">
          Ingestion Hub
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload student essays (CSV for typed essays or images for handwritten essays)
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
          <AlertBox type="error">No assignments found. Create one in Rubric Builder first.</AlertBox>
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

      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-2 bg-white rounded-xl shadow-sm p-1.5">
        <button
          onClick={() => setMode('csv')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'csv' ? 'bg-ink-maroon text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FileText size={16} />
          <span className="hidden sm:inline">Upload CSV (Typed Essays)</span>
          <span className="sm:hidden">CSV</span>
        </button>
        <button
          onClick={() => setMode('photos')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'photos' ? 'bg-ink-maroon text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ImageIcon size={16} />
          <span className="hidden sm:inline">Upload Photos (Handwritten)</span>
          <span className="sm:hidden">Photos</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Upload zone + preview */}
        <div className="lg:col-span-2 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 md:p-10 text-center transition-colors ${
              isDragging ? 'border-ink-maroon bg-ink-maroon/5' : 'border-gray-300 bg-white'
            }`}
          >
            <Upload className="mx-auto mb-3 text-ink-maroon" size={32} />
            <p className="text-sm text-gray-600 mb-4">
              Drag & drop your {mode === 'csv' ? 'CSV file' : 'photos'} here
            </p>
            <label className="inline-block bg-ink-maroon text-white text-sm font-semibold px-5 py-2.5 rounded-lg cursor-pointer hover:bg-ink-maroon-dark transition-colors">
              {mode === 'csv' ? 'Choose CSV File' : 'Choose Photos'}
              <input
                type="file"
                accept={mode === 'csv' ? '.csv' : 'image/*'}
                multiple={mode === 'photos'}
                className="hidden"
                onChange={(e) =>
                  mode === 'csv' ? handleCsvFile(e.target.files[0]) : addPhotos(e.target.files)
                }
              />
            </label>
            <p className="text-xs text-gray-400 mt-4">
              {mode === 'csv' ? 'Supports .csv files' : 'Supports .jpg, .png — max 10MB per image'}
            </p>
          </div>

          {mode === 'csv' && csvError && <AlertBox type="error">{csvError}</AlertBox>}

          {mode === 'csv' && parsedRows.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 overflow-x-auto">
              <p className="text-sm font-medium text-gray-700 mb-3">
                {csvFileName} — {parsedRows.length} student{parsedRows.length !== 1 ? 's' : ''} found
              </p>
              <table className="w-full text-sm min-w-125">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4 font-medium">Student</th>
                    <th className="py-2 pr-4 font-medium">Section</th>
                    <th className="py-2 font-medium">Essay Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 8).map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4">{r.student_name}</td>
                      <td className="py-2 pr-4">{r.section || '—'}</td>
                      <td className="py-2 text-gray-500 truncate max-w-xs">{r.essay_content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > 8 && (
                <p className="text-xs text-gray-400 mt-2">+ {parsedRows.length - 8} more</p>
              )}
            </div>
          )}

          {mode === 'photos' && photoEntries.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 space-y-3">
              <p className="text-sm font-medium text-gray-700">
                {photoEntries.length} photo{photoEntries.length !== 1 ? 's' : ''} added
              </p>
              {photoEntries.map((p) => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-2 border border-gray-200 rounded-lg p-2">
                  <img src={p.previewUrl} alt="essay" className="w-14 h-14 object-cover rounded-md shrink-0" />
                  <div className="flex flex-1 gap-2 min-w-0">
                    <input
                      type="text"
                      placeholder="Student name"
                      value={p.studentName}
                      onChange={(e) => updatePhotoEntry(p.id, 'studentName', e.target.value)}
                      className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Section"
                      value={p.section}
                      onChange={(e) => updatePhotoEntry(p.id, 'section', e.target.value)}
                      className="w-20 sm:w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                    />
                    <button onClick={() => removePhotoEntry(p.id)} className="text-red-500 hover:text-red-700 shrink-0">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h2 className="font-semibold text-gray-800 mb-2">Upload Guidelines</h2>
            <ul className="text-xs text-gray-500 space-y-1.5 list-disc pl-4">
              <li><strong className="text-gray-600">CSV format:</strong> columns student_name, section, essay_content (one row per student)</li>
              <li><strong className="text-gray-600">Image tips:</strong> clear, well-lit photos</li>
              <li>Supported formats: .jpg, .png</li>
              <li>Max file size: 10MB per image</li>
            </ul>
          </div>

          <div className="flex items-start gap-2 bg-ink-cream border border-ink-gold/30 rounded-lg p-3 text-xs text-gray-600">
            <ShieldCheck size={16} className="text-ink-gold shrink-0 mt-0.5" />
            Student names are masked before being sent to AI engines.
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitStatus === 'submitting'}
            className="w-full bg-ink-maroon text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-ink-maroon-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitStatus === 'submitting' && <Loader2 size={16} className="animate-spin" />}
            {submitStatus === 'submitting' ? 'Uploading...' : 'Submit to Queue'}
          </button>

          {submitStatus === 'success' && <AlertBox type="success">Submissions added to queue</AlertBox>}
          {submitStatus === 'error' && <AlertBox type="error">{submitError}</AlertBox>}
        </div>
      </div>
    </div>
  )
}