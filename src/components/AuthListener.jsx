import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthListener() {
  const { authEvent } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (authEvent === 'PASSWORD_RECOVERY') {
      navigate('/reset-password', { replace: true })
    }
  }, [authEvent, navigate])

  return null
}