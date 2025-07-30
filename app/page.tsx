'use client'

import { ErrorCard } from '@/components/error-card'

export default function Home() {
  return (
    <ErrorCard 
      title="Survey Link Required"
      message="To access a survey, you need a valid survey link. These links are sent via email and contain a unique identifier for your specific survey."
    />
  )
}
