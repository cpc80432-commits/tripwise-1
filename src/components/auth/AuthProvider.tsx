'use client'
import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { createOrUpdateUser } from '@/lib/firestore'
import { useAuthStore } from '@/store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = {
          uid:    firebaseUser.uid,
          name:   firebaseUser.displayName || '旅行者',
          email:  firebaseUser.email || '',
          avatar: firebaseUser.photoURL || '',
        }
        setUser(appUser)
        await createOrUpdateUser(firebaseUser.uid, appUser).catch(() => {})
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [setUser, setLoading])

  return <>{children}</>
}
