'use client'

import { useEffect, useState } from 'react'
import type { GameEvent } from '../../hooks/useWorkout'

interface XPToastProps {
  events: GameEvent[]
  onDone: () => void
}

export default function XPToast({ events, onDone }: XPToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 2500)
    return () => clearTimeout(timer)
  }, [onDone])

  const xpEvent    = events.find((e) => e.type === 'XP_GAINED')
  const levelEvent = events.find((e) => e.type === 'LEVEL_UP')

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    }`}>
      <div className="bg-gray-900 text-white rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3">
        {levelEvent ? (
          <>
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-sm">Level Up!</p>
              <p className="text-xs text-gray-400">Du hast Level {String(levelEvent.payload.newLevel)} erreicht</p>
            </div>
          </>
        ) : xpEvent ? (
          <>
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-semibold">+{String(xpEvent.payload.amount)} XP verdient</p>
              <p className="text-xs text-gray-400 mt-0.5">Workout abgeschlossen!</p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
