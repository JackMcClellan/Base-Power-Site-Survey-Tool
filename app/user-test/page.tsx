'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UserTestPage() {
  const router = useRouter()

  useEffect(() => {
    // Generate a random UUID
    const newUuid = crypto.randomUUID()
    
    // Redirect to the survey page with the generated UUID
    router.replace(`/survey/${newUuid}`)
  }, [router])

  // Show a brief loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Setting up your test survey...</h2>
        <p className="text-sm text-muted-foreground mt-2">Redirecting...</p>
      </div>
    </div>
  )
} 