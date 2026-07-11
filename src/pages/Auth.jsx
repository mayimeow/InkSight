import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight, PenTool } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function withTimeout(promise, ms, timeoutMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutMessage)), ms)),
  ])
}

export default function Auth() {
  const { signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const switchMode = (newMode) => {
    setMode(newMode)
    setStatus('idle')
    setErrorMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      if (mode === 'forgot') {
        const { error } = await withTimeout(
          resetPassword(email), 15000, 'This is taking too long. Please try again.'
        )
        if (error) { setErrorMessage(error.message); setStatus('error'); return }
        setStatus('reset-sent')
        return
      }

      if (mode === 'signup' && !fullName.trim()) {
        setErrorMessage('Please enter your full name.')
        setStatus('error')
        return
      }

      const { error } = mode === 'login'
        ? await withTimeout(signIn(email, password), 15000, 'Login is taking too long. Please try again.')
        : await withTimeout(signUp(email, password, fullName.trim()), 15000, 'Sign up is taking too long. Please try again.')

      if (error) {
        setErrorMessage(error.message)
        setStatus('error')
        return
      }

      if (mode === 'signup') {
        setStatus('signup-success')
      } else {
        setStatus('idle')
        navigate('/') // Rubric Builder is the home route, not /dashboard
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 md:bg-white">
      {/* Left: Dark geometric branding panel */}
      <div className="relative overflow-hidden bg-[#2a0509] flex flex-col justify-between px-6 pt-10 pb-16 md:px-14 md:py-12 shrink-0 md:w-5/12 lg:w-1/2 md:min-h-screen">
        <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4a0e14" />
              <stop offset="100%" stopColor="#2a0509" />
            </linearGradient>
          </defs>
          <rect width="800" height="1000" fill="url(#g1)" />
          <polygon points="0,0 400,0 200,300 0,250" fill="#5C0F1A" opacity="0.6" />
          <polygon points="400,0 800,0 800,400 500,300" fill="#7a1620" opacity="0.5" />
          <polygon points="0,250 200,300 100,700 0,650" fill="#6b1319" opacity="0.5" />
          <polygon points="500,300 800,400 800,750 450,650" fill="#3d0c10" opacity="0.7" />
          <polygon points="0,650 450,650 350,1000 0,1000" fill="#5C0F1A" opacity="0.4" />
          <polygon points="450,650 800,750 800,1000 300,1000" fill="#7a1620" opacity="0.35" />
          <line x1="200" y1="300" x2="500" y2="300" stroke="#C9A227" strokeWidth="1" opacity="0.3" />
          <line x1="100" y1="700" x2="450" y2="650" stroke="#C9A227" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative flex items-center gap-2.5 mb-8 md:mb-0">
          <PenTool className="text-white w-10 h-10 md:w-11 md:h-11" />
          <span className="text-white font-bold text-xl tracking-wide">InkSight</span>
        </div>

        <div className="relative max-w-md hidden sm:block">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-[1.1] mb-4">
            Grade Smarter.<br />Teach Better.
          </h1>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            AI-powered essay grading built for real classrooms — instant scores, actionable insights, zero guesswork.
          </p>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-12 -mt-10 md:mt-0 relative z-10">
        <div className="w-full max-w-md bg-white p-8 md:p-0 rounded-3xl shadow-xl shadow-gray-200/50 md:shadow-none">
          {mode === 'login' && (
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Welcome Back!</h2>
              <p className="text-sm text-gray-500 mt-2">Log in to continue to InkSight.</p>
            </div>
          )}
          {mode === 'signup' && (
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Create Account</h2>
              <p className="text-sm text-gray-500 mt-2">Start grading smarter today.</p>
            </div>
          )}
          {mode === 'forgot' && (
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Reset Password</h2>
              <p className="text-sm text-gray-500 mt-2">We'll email you a secure reset link.</p>
            </div>
          )}

          {status === 'signup-success' ? (
            <div className="text-center text-sm text-gray-600 space-y-4 py-8 bg-green-50 rounded-2xl border border-green-100">
              <CheckCircle2 size={32} className="mx-auto text-green-600" />
              <p className="px-6">Account created. Please check your email to confirm, then log in.</p>
              <button onClick={() => switchMode('login')} className="text-ink-maroon font-semibold hover:text-[#4a0e14] transition-colors">Back to Log In</button>
            </div>
          ) : status === 'reset-sent' ? (
            <div className="text-center text-sm text-gray-600 space-y-4 py-8 bg-green-50 rounded-2xl border border-green-100">
              <CheckCircle2 size={32} className="mx-auto text-green-600" />
              <p className="px-6">Reset link sent. Check your email for instructions.</p>
              <button onClick={() => switchMode('login')} className="text-ink-maroon font-semibold hover:text-[#4a0e14] transition-colors">Back to Log In</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative group">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-ink-maroon transition-colors" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Juan Dela Cruz"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-ink-maroon/10 focus:border-ink-maroon focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Email</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-ink-maroon transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@school.edu"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-ink-maroon/10 focus:border-ink-maroon focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-ink-maroon transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-12 py-3.5 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-ink-maroon/10 focus:border-ink-maroon focus:bg-white transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-ink-maroon focus:ring-ink-maroon/30 cursor-pointer" />
                    Remember me
                  </label>
                  <button type="button" onClick={() => switchMode('forgot')} className="text-sm text-ink-maroon hover:text-[#4a0e14] font-semibold transition-colors">
                    Forgot Password?
                  </button>
                </div>
              )}

              {status === 'error' && (
                <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3.5 rounded-xl border border-red-100">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span className="leading-tight">{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-[#1a1a1a] text-white rounded-xl py-3.5 text-sm font-bold tracking-wide hover:bg-black hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2 mt-2"
              >
                {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : (
                  <>
                    {mode === 'login' ? 'Log In to InkSight' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                    {mode !== 'forgot' && <ArrowRight size={18} />}
                  </>
                )}
              </button>

              {mode === 'forgot' ? (
                <button type="button" onClick={() => switchMode('login')} className="w-full text-center text-sm text-gray-500 hover:text-gray-800 font-medium pt-2 transition-colors">
                  &larr; Back to Log In
                </button>
              ) : (
                <div className="text-center text-sm text-gray-500 pt-4">
                  {mode === 'login' ? (
                    <>New to InkSight?{' '}
                      <button type="button" onClick={() => switchMode('signup')} className="text-ink-maroon font-bold hover:text-[#4a0e14] transition-colors">
                        Sign up here
                      </button>
                    </>
                  ) : (
                    <>Already have an account?{' '}
                      <button type="button" onClick={() => switchMode('login')} className="text-ink-maroon font-bold hover:text-[#4a0e14] transition-colors">
                        Log in here
                      </button>
                    </>
                  )}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}