import { useState } from 'react'
import { User, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import PageHeader from '../components/PageHeader'

export default function Settings() {
  const { user } = useAuth()

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [profileStatus, setProfileStatus] = useState('idle')
  const [profileError, setProfileError] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState('idle')
  const [passwordError, setPasswordError] = useState('')

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileError('')

    if (!fullName.trim()) {
      setProfileError('Full name cannot be empty.')
      setProfileStatus('error')
      return
    }

    setProfileStatus('saving')
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } })

    if (error) {
      setProfileError(error.message)
      setProfileStatus('error')
      return
    }

    setProfileStatus('success')
    setTimeout(() => setProfileStatus('idle'), 2000)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      setPasswordStatus('error')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      setPasswordStatus('error')
      return
    }

    setPasswordStatus('saving')
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordError(error.message)
      setPasswordStatus('error')
      return
    }

    setPasswordStatus('success')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPasswordStatus('idle'), 2500)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader eyebrow="Account" title="Settings" subtitle="Manage your profile and account security." />

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-display text-base font-semibold text-gray-900 mb-1">Profile</h2>
        <p className="text-xs text-gray-500 mb-5">Update your display name and view your account email.</p>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-ink-maroon/10 focus:border-ink-maroon transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full border border-gray-100 bg-gray-50 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Email cannot be changed here. Contact support if needed.</p>
          </div>

          {profileStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-100 rounded-lg p-2.5">
              <AlertCircle size={14} /> {profileError}
            </div>
          )}
          {profileStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-700 text-xs bg-green-50 border border-green-100 rounded-lg p-2.5">
              <CheckCircle2 size={14} /> Profile updated
            </div>
          )}

          <button
            type="submit"
            disabled={profileStatus === 'saving'}
            className="bg-ink-maroon text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-ink-maroon-dark hover:shadow-md transition-all disabled:opacity-60 disabled:hover:shadow-none flex items-center gap-2"
          >
            {profileStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
            {profileStatus === 'saving' ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-display text-base font-semibold text-gray-900 mb-1">Change Password</h2>
        <p className="text-xs text-gray-500 mb-5">Choose a new password for your account.</p>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-ink-maroon/10 focus:border-ink-maroon transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-ink-maroon/10 focus:border-ink-maroon transition-all"
                />
              </div>
            </div>
          </div>

          {passwordStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-100 rounded-lg p-2.5">
              <AlertCircle size={14} /> {passwordError}
            </div>
          )}
          {passwordStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-700 text-xs bg-green-50 border border-green-100 rounded-lg p-2.5">
              <CheckCircle2 size={14} /> Password changed successfully
            </div>
          )}

          <button
            type="submit"
            disabled={passwordStatus === 'saving'}
            className="bg-ink-maroon text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-ink-maroon-dark hover:shadow-md transition-all disabled:opacity-60 disabled:hover:shadow-none flex items-center gap-2"
          >
            {passwordStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
            {passwordStatus === 'saving' ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}