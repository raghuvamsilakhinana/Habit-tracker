import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Central place that tracks whether someone is logged in.
// Every component that needs to know "who is the current user"
// reads from this hook instead of talking to Supabase directly.
export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return { session, user: session?.user ?? null, loading }
}
