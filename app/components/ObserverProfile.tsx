'use client'

import { useState, useEffect } from 'react'

interface ProfileData {
  resonance: number
  votes: number
  artifacts: number
  tier: string
}

export default function ObserverProfile({ account }: { account: string }) {
  const [profile, setProfile] = useState<ProfileData | null>(null)

  useEffect(() => {
    fetch(`/api/profile?account=${encodeURIComponent(account)}`)
      .then(r => r.json())
      .then(setProfile)
      .catch(() => null)
  }, [account])

  if (!profile) return null

  const stats = [
    `${profile.votes} observation${profile.votes !== 1 ? 's' : ''}`,
    profile.artifacts > 0 ? `${profile.artifacts} artifact${profile.artifacts !== 1 ? 's' : ''}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
        {profile.tier}
      </p>
      <p className="text-4xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
        {profile.resonance}
      </p>
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">Resonance</p>
      {stats && (
        <p className="mt-1 text-xs text-zinc-500">{stats}</p>
      )}
    </div>
  )
}
