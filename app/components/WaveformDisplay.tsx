'use client'

import { useState, useEffect, useRef } from 'react'

const SVG_W = 300
const SVG_H = 150
const BASE_Y = SVG_H - 12
const CENTER_X = SVG_W / 2
const MAX_AMP = 105
const YIELD_AMP = 32

export const MAX_YIELD = 0.25
export const MIN_YIELD = 0.05

export function computeYield(maxShare: number): number {
  const t = Math.max(0, Math.min(1, (maxShare - 0.5) * 2))
  return MIN_YIELD + (MAX_YIELD - MIN_YIELD) * (1 - t)
}

// One Gaussian peak per choice, heights proportional to vote share
function buildChoicePeaks(shares: number[], time: number) {
  const N = shares.length
  const sigma = Math.max(16, SVG_W / (N * 3.5))
  const centers = shares.map((_, i) => SVG_W * (i + 1) / (N + 1))

  const pts: string[] = []
  for (let i = 0; i <= 120; i++) {
    const x = (i / 120) * SVG_W
    let h = 0
    for (let j = 0; j < N; j++) {
      const g = Math.exp(-0.5 * ((x - centers[j]) / sigma) ** 2)
      const breathe = 1 + Math.sin(time * 0.00085 + j * 2.1) * 0.09
      const shimmer = (
        Math.sin(x * 0.13 + time * 0.0014 + j * 1.9) * 2.0 +
        Math.sin(x * 0.37 + time * 0.0021 + j * 1.3) * 1.0
      ) * g
      h += MAX_AMP * shares[j] * g * breathe + shimmer
    }
    pts.push(`${x.toFixed(1)},${Math.max(0, BASE_Y - h).toFixed(1)}`)
  }
  const stroke = 'M ' + pts.join(' L ')
  const area = `M 0,${BASE_Y} L ${pts.join(' L ')} L ${SVG_W},${BASE_Y} Z`
  return { area, stroke }
}

// Single centered amber wave — amplitude proportional to yield (high when balanced)
function buildYieldWave(yieldFactor: number, time: number) {
  const amp = YIELD_AMP * yieldFactor
  const pts: string[] = []
  for (let i = 0; i <= 120; i++) {
    const x = (i / 120) * SVG_W
    const g = Math.exp(-0.5 * ((x - CENTER_X) / 58) ** 2)
    const breathe = 1 + Math.sin(time * 0.00085 + 2.1) * 0.13
    pts.push(`${x.toFixed(1)},${Math.max(0, BASE_Y - amp * g * breathe).toFixed(1)}`)
  }
  const stroke = 'M ' + pts.join(' L ')
  const area = `M 0,${BASE_Y} L ${pts.join(' L ')} L ${SVG_W},${BASE_Y} Z`
  return { area, stroke }
}

const COLORS = {
  dark: {
    baseline:  'rgb(63,63,70)',
    certainty: { area: 'rgba(255,255,255,0.03)', glow: 'rgba(255,255,255,0.10)', bright: 'rgba(255,255,255,0.55)' },
    yield:     { area: 'rgba(251,191,36,0.06)',  glow: 'rgba(251,191,36,0.15)',  bright: 'rgba(251,191,36,0.80)' },
  },
  light: {
    baseline:  'rgb(212,212,216)',
    certainty: { area: 'rgba(63,63,70,0.05)',  glow: 'rgba(63,63,70,0.12)',  bright: 'rgba(63,63,70,0.65)'  },
    yield:     { area: 'rgba(180,83,9,0.05)',  glow: 'rgba(180,83,9,0.15)',  bright: 'rgba(180,83,9,0.80)'  },
  },
}

const BASELINE_PATH = `M 0,${BASE_Y} L ${SVG_W},${BASE_Y}`

export default function WaveformDisplay({ counts }: { counts: Record<string, number> | null }) {
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0
  const hasVotes = total > 0

  // Shares: one entry per choice, proportional to weighted vote count
  // Default to two equal peaks when no votes (quantum superposition state)
  const shares: number[] = hasVotes
    ? Object.keys(counts!).sort().map(k => (counts![k] ?? 0) / total)
    : [0.5, 0.5]

  const maxShare = hasVotes ? Math.max(...shares) : 0.5
  const N = shares.length
  // yieldFactor: 1.0 when perfectly balanced, 0.0 when fully one-sided
  const yieldFactor = N > 1 ? Math.max(0, 1 - (N * maxShare - 1) / (N - 1)) : 0
  const yieldPct = computeYield(maxShare)

  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const el = document.documentElement
    const check = () => setIsDark(el.classList.contains('dark'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Mutable refs so the animation loop always reads latest values without restarting
  const sharesRef = useRef(shares)
  sharesRef.current = shares
  const yieldRef = useRef(yieldFactor)
  yieldRef.current = yieldFactor

  const areaCRef         = useRef<SVGPathElement>(null)
  const strokeCGlowRef   = useRef<SVGPathElement>(null)
  const strokeCBrightRef = useRef<SVGPathElement>(null)
  const areaYRef         = useRef<SVGPathElement>(null)
  const strokeYGlowRef   = useRef<SVGPathElement>(null)
  const strokeYBrightRef = useRef<SVGPathElement>(null)
  const baselineRef      = useRef<SVGLineElement>(null)

  useEffect(() => {
    const c = isDark ? COLORS.dark : COLORS.light
    baselineRef.current?.setAttribute('stroke', c.baseline)
    areaCRef.current?.setAttribute('fill', c.certainty.area)
    strokeCGlowRef.current?.setAttribute('stroke', c.certainty.glow)
    strokeCBrightRef.current?.setAttribute('stroke', c.certainty.bright)
    areaYRef.current?.setAttribute('fill', c.yield.area)
    strokeYGlowRef.current?.setAttribute('stroke', c.yield.glow)
    strokeYBrightRef.current?.setAttribute('stroke', c.yield.bright)
  }, [isDark])

  // Animation loop — bypasses React for smooth 60fps, reads shares/yield from refs
  useEffect(() => {
    let animId: number
    const animate = (ts: number) => {
      const { area: aC, stroke: sC } = buildChoicePeaks(sharesRef.current, ts)
      const { area: aY, stroke: sY } = buildYieldWave(yieldRef.current, ts)
      areaCRef.current?.setAttribute('d', aC)
      strokeCGlowRef.current?.setAttribute('d', sC)
      strokeCBrightRef.current?.setAttribute('d', sC)
      areaYRef.current?.setAttribute('d', aY)
      strokeYGlowRef.current?.setAttribute('d', sY)
      strokeYBrightRef.current?.setAttribute('d', sY)
      animId = requestAnimationFrame(animate)
    }
    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [])

  const c = isDark ? COLORS.dark : COLORS.light

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-0 dark:bg-zinc-950 dark:shadow-none">
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-300">
          Quantum State
        </p>

        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width={SVG_W} height={SVG_H} className="w-full overflow-visible">
          <line ref={baselineRef} x1={0} y1={BASE_Y} x2={SVG_W} y2={BASE_Y}
            stroke={c.baseline} strokeWidth={1} />

          {/* Yield wave — amber glow, fades as vote becomes one-sided */}
          <path ref={areaYRef}         d={BASELINE_PATH} fill={c.yield.area} />
          <path ref={strokeYGlowRef}   d={BASELINE_PATH} fill="none" stroke={c.yield.glow}   strokeWidth={7} />
          <path ref={strokeYBrightRef} d={BASELINE_PATH} fill="none" stroke={c.yield.bright} strokeWidth={1.5} />

          {/* Choice peaks — one per choice, height = vote share */}
          <path ref={areaCRef}         d={BASELINE_PATH} fill={c.certainty.area} />
          <path ref={strokeCGlowRef}   d={BASELINE_PATH} fill="none" stroke={c.certainty.glow}   strokeWidth={7} />
          <path ref={strokeCBrightRef} d={BASELINE_PATH} fill="none" stroke={c.certainty.bright} strokeWidth={1.5} />
        </svg>

        <div className="flex w-full justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-white/50" />
            Observer Consensus
          </span>
          <span className="flex items-center gap-1.5">
            Artifact Yield
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-600/75 dark:bg-amber-400/75" />
          </span>
        </div>

        {hasVotes ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Yield:{' '}
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{Math.round(yieldPct * 100)}%</span>
            {' '}of winners · consensus {Math.round(maxShare * 100)}%
          </p>
        ) : (
          <p className="text-xs italic text-zinc-400 dark:text-zinc-500">Awaiting observations</p>
        )}
      </div>
    </div>
  )
}
