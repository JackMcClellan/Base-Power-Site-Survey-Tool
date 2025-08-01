'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home with a query parameter to indicate 404
    router.replace('/')
  }, [router])

  // Show nothing while redirecting
  return null
} 