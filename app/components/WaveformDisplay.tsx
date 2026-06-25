'use client'

import { useState, useEffect, useMemo } from 'react'

const SVG_W = 300
const SVG_H = 150
const BASE_Y = SVG_H - 12
const CENTER_X = SVG_W / 2
const SIGMA_MIN = 18
const SIGMA_MAX = 88
// Normalizing constant: keeps area under each curve roughly fixed
// so neither wave visually "dominates" just due to sigma change
const K = SIGMA_MIN * 120

export const MAX_YIELD = 0.25
export const MIN_YIELD = 0.05

export function computeYield(p: number): number {
  const t = Math.max(0, Math.min(1, (p - 0.5) * 2))
  return MIN_YIELD + (MAX_YIELD - MIN_YIELD) * (1 - t)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

function gaussianArea(sigma: number, amplitude: number): string {
  const pts: string[] = []
  for (let i = 0; i <= 200; i++) {
    const x = (i / 200) * SVG_W
    const g = Math.exp(-0.5 * ((x - CENTER_X) / sigma) ** 2)
    const y = Math.max(0, BASE_Y - amplitude * g)
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return `M 0,${BASE_Y} L ${pts.join(' L ')} L ${SVG_W},${BASE_Y} Z`
}

function gaussianStroke(sigma: number, amplitude: number): string {
  const pts: string[] = []
  for (let i = 0; i <= 200; i++) {
    const x = (i / 200) * SVG_W
    const g = Math.exp(-0.5 * ((x - CENTER_X) / sigma) ** 2)
    const y = Math.max(0, BASE_Y - amplitude * g)
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return 'M ' + pts.join(' L ')
}

export default function WaveformDisplay() {
  const [p, setP] = useState(0.5)
  const [hasVotes, setHasVotes] = useState(false)

  useEffect(() => {
    const update = async () => {
      try {
        const res = await fetch('/api/tally')
        if (!res.ok) return
        const data = await res.json()
        const counts: Record<string, number> = data.counts ?? {}
        const total = Object.values(counts).reduce((a, b) => a + b, 0)
        if (total === 0) return
        const max = Math.max(...Object.values(counts))
        setP(max / total)
        setHasVotes(true)
      } catch { /* ignore */ }
    }
    update()
    const id = setInterval(update, 15000)
    return () => clearInterval(id)
  }, [])

  const t = Math.max(0, Math.min(1, (p - 0.5) * 2))
  const sigmaC = lerp(SIGMA_MAX, SIGMA_MIN, t)
  const sigmaY = lerp(SIGMA_MIN, SIGMA_MAX, t)
  const ampC = K / sigmaC
  const ampY = K / sigmaY
  const yieldPct = computeYield(p)

  const areaC = useMemo(() => gaussianArea(sigmaC, ampC), [sigmaC, ampC])
  const areaY = useMemo(() => gaussianArea(sigmaY, ampY), [sigmaY, ampY])
  const strokeC = useMemo(() => gaussianStroke(sigmaC, ampC), [sigmaC, ampC])
  const strokeY = useMemo(() => gaussianStroke(sigmaY, ampY), [sigmaY, ampY])

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
        Quantum State
      </p>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width={SVG_W}
        height={SVG_H}
        className="w-full overflow-visible"
      >
        {/* Baseline */}
        <line x1={0} y1={BASE_Y} x2={SVG_W} y2={BASE_Y}
          stroke="rgb(63,63,70)" strokeWidth={1} />

        {/* Yield wave — amber */}
        <path d={areaY} fill="rgba(251,191,36,0.06)" />
        <path d={strokeY} fill="none" stroke="rgba(251,191,36,0.15)" strokeWidth={7} />
        <path d={strokeY} fill="none" stroke="rgba(251,191,36,0.80)" strokeWidth={1.5} />

        {/* Certainty wave — white */}
        <path d={areaC} fill="rgba(255,255,255,0.03)" />
        <path d={strokeC} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={7} />
        <path d={strokeC} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      </svg>

      <div className="flex w-full justify-between text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/50" />
          Observer Consensus
        </span>
        <span className="flex items-center gap-1.5">
          Artifact Yield
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400/75" />
        </span>
      </div>

      {hasVotes ? (
        <p className="text-xs text-zinc-500">
          Yield:{' '}
          <span className="font-semibold text-zinc-300">{Math.round(yieldPct * 100)}%</span>
          {' '}of winners · consensus {Math.round(p * 100)}%
        </p>
      ) : (
        <p className="text-xs italic text-zinc-600">Awaiting observations</p>
      )}
    </div>
  )
}
