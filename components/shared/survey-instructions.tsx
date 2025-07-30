'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface SurveyInstructionsProps {
  instructions: string
  tips?: string[]
  warnings?: string[]
  className?: string
}

export function SurveyInstructions({ instructions, tips, warnings, className = '' }: SurveyInstructionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasTips = tips && tips.length > 0
  const hasWarnings = warnings && warnings.length > 0
  const hasExpandableContent = hasTips || hasWarnings
  
  return (
    <div className={`px-6 pb-4 ${className}`}>
      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white">
        <div 
          className={`${hasExpandableContent ? 'cursor-pointer hover:bg-white/5 -m-2 p-2 rounded transition-colors' : ''}`}
          onClick={() => hasExpandableContent && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm leading-relaxed select-none flex-1">
              {instructions}
            </p>
            {hasExpandableContent && (
              <div className="ml-2 text-white">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </div>
            )}
          </div>
        </div>
        
        {hasExpandableContent && isExpanded && (
          <div className="border-t border-white/20 pt-3 mt-3 space-y-3">
            {hasTips && (
              <div>
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
            
            {hasWarnings && (
              <div>
                <p className="text-xs font-semibold text-destructive mb-2">Safety Warnings:</p>
                <ul className="space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index} className="text-xs text-red-300 flex items-start gap-2">
                      <span className="text-destructive mt-0.5">⚠</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 