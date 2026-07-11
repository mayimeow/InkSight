import { useState } from 'react'
import { PenLine, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setErrorMessage(error.message)
      setStatus('error')
      return
    }

    setStatus('success')
    setTimeout(() => navigate('/'), 2000)
  }

  return (
    <div className="min-h-screen bg-ink-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 text-xl font-bold text-ink-maroon mb-6 justify-center">
          <PenLine size={22} />
          InkSight
        </div>
        <h1 className="text-lg font-semibold text-gray-800 mb-1 text-center">Set a new password</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Enter a new password for your account.</p>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-2 text-center text-sm text-green-600 py-4">
            <CheckCircle2 size={24} />
            Password updated! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-maroon/40"
              />
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-600 text-xs">
                <AlertCircle size={14} /> {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-ink-maroon text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-ink-maroon-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  )
}