'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface SurveyInstructionsProps {
  instructions: string
  tips?: string[]
  className?: string
}

export function SurveyInstructions({ instructions, tips, className = '' }: SurveyInstructionsProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasTips = tips && tips.length > 0
  
  return (
    <div className={`px-6 pb-4 ${className}`}>
      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white">
        <div 
          className={`${hasTips ? 'cursor-pointer hover:bg-white/5 -m-2 p-2 rounded transition-colors' : ''}`}
          onClick={() => hasTips && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm leading-relaxed select-none flex-1">
              {instructions}
            </p>
            {hasTips && (
              <div className="ml-2 text-white">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </div>
            )}
          </div>
        </div>
        
        {hasTips && isExpanded && (
          <div className="border-t border-white/20 pt-3 mt-3">
            <p className="text-xs font-semibold text-primary mb-2">Tips:</p>
            <ul className="space-y-1">
              {tips.map((tip, index) => (
                <li key={index} className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
} 