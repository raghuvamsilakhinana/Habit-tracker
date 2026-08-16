import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!userId) { setProfile(null); setLoading(false); return }
    let cancelled = false
    supabase.from('profiles').select('id, email, is_admin, created_at').eq('id', userId).single().then(({ data, error }) => {
      if (cancelled) return
      if (!error) setProfile(data)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [userId])
  return { profile, loading }
}
