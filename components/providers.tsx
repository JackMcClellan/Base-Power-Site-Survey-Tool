'use client'

import { Provider } from 'jotai'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider>
      {children}
    </Provider>
  )
} 