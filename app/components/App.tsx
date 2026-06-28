'use client'

import { useState, useEffect } from 'react'
import WalletConnect from './WalletConnect'
import ObserverProfile from './ObserverProfile'
import ArtifactClaim from './ArtifactClaim'
import Vote from './Vote'
import WaveformDisplay from './WaveformDisplay'
import ChapterArtifact from './ChapterArtifact'
import Tally from './Tally'

interface TallyData {
  counts: Record<string, number>
  choices: Record<string, { label: string; description: string }>
}

export default function App() {
  const [account, setAccount] = useState<string | null>(null)
  const [tally, setTally] = useState<TallyData | null>(null)
  const [profileEpoch, setProfileEpoch] = useState(0)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/tally')
        if (res.ok) setTally(await res.json())
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, 15000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex w-full flex-col gap-8">
      <WalletConnect onAccountChange={setAccount} />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">

        {/* Main reading column */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {account && <ArtifactClaim key={account} account={account} onClaimed={() => setProfileEpoch(e => e + 1)} />}
          {account && <Vote key={account} account={account} />}
          <Tally tally={tally} />
        </div>

        {/* Sticky sidebar */}
        <aside className="flex flex-col gap-4 lg:w-64 lg:shrink-0 lg:sticky lg:top-8">
          {account && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <ObserverProfile key={`${account}-${profileEpoch}`} account={account} />
            </div>
          )}
          <WaveformDisplay counts={tally?.counts ?? null} />
          <ChapterArtifact />
        </aside>

      </div>
    </div>
  )
}
