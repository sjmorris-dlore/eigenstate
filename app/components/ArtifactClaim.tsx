'use client'

import { useState, useEffect, useRef } from 'react'

interface ArtifactOffer {
  offer_id: string
  choice_point: string
  nft_uri: string
  expires_at: string
}

interface ArtifactClaimProps {
  account: string
}

export default function ArtifactClaim({ account }: ArtifactClaimProps) {
  const [offer, setOffer] = useState<ArtifactOffer | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [signUrl, setSignUrl] = useState<string | null>(null)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch(`/api/artifact?account=${encodeURIComponent(account)}`)
      .then(r => r.json())
      .then(data => {
        if (data.claims?.length > 0) setOffer(data.claims[0])
      })
      .catch(() => null)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [account])

  const claim = async () => {
    if (!offer) return
    setError(null)

    const res = await fetch('/api/artifact/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, offer_id: offer.offer_id }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(JSON.stringify(data?.error ?? data))
      return
    }

    setQr(data.qr)
    setSignUrl(data.signUrl)

    intervalRef.current = setInterval(async () => {
      const status = await fetch(`/api/vote/${data.uuid}`)
      const s = await status.json()

      if (s.signed) {
        clearInterval(intervalRef.current!)
        setQr(null)
        setSignUrl(null)
        // Mark claimed in DB
        await fetch('/api/artifact/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offer_id: offer.offer_id }),
        })
        setClaimed(true)
        setOffer(null)
      } else if (s.expired || s.rejected) {
        clearInterval(intervalRef.current!)
        setQr(null)
        setSignUrl(null)
      }
    }, 2000)
  }

  const cancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setQr(null)
    setSignUrl(null)
  }

  if (claimed) {
    return (
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-700">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Artifact claimed.</p>
        <p className="mt-1 text-xs text-zinc-500">It now lives in your wallet.</p>
      </div>
    )
  }

  if (qr && signUrl) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Claim your artifact</p>
        <p className="text-xs text-zinc-500">Scan with Xaman to accept</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="Xaman claim QR" width={160} height={160} />
        <a href={signUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 underline">
          Open in Xaman
        </a>
        <button onClick={cancel} className="text-xs text-zinc-400 underline">Cancel</button>
      </div>
    )
  }

  if (!offer) return null

  return (
    <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Artifact Available</p>
      <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
        You have an unclaimed artifact from {offer.choice_point}.
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Expires {new Date(offer.expires_at).toLocaleDateString()}
      </p>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <button
        onClick={claim}
        className="mt-3 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Claim Artifact
      </button>
    </div>
  )
}
