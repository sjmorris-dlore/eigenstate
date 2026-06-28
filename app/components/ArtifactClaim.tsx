'use client'

import { useState, useEffect, useRef } from 'react'

interface ArtifactOffer {
  offer_id: string
  choice_point: string
  nft_uri: string
  expires_at: string
  artifact_type?: string
}

interface ArtifactClaimProps {
  account: string
  onClaimed?: () => void
}

export default function ArtifactClaim({ account, onClaimed }: ArtifactClaimProps) {
  const [claims, setClaims] = useState<ArtifactOffer[]>([])
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set())
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())
  const [activeOffer, setActiveOffer] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [signUrl, setSignUrl] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch(`/api/artifact?account=${encodeURIComponent(account)}`)
      .then(r => r.json())
      .then(data => { if (data.claims?.length > 0) setClaims(data.claims) })
      .catch(() => null)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [account])

  const visible = claims.filter(
    c => !claimedIds.has(c.offer_id) && !skippedIds.has(c.offer_id)
  )

  const claim = async (offer: ArtifactOffer) => {
    setErrors(prev => ({ ...prev, [offer.offer_id]: '' }))
    setActiveOffer(offer.offer_id)

    const res = await fetch('/api/artifact/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, offer_id: offer.offer_id }),
    })
    const data = await res.json()

    if (!res.ok) {
      setErrors(prev => ({ ...prev, [offer.offer_id]: JSON.stringify(data?.error ?? data) }))
      setActiveOffer(null)
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
        setActiveOffer(null)
        if (s.dispatched_result && s.dispatched_result !== 'tesSUCCESS') {
          setErrors(prev => ({
            ...prev,
            [offer.offer_id]: `Transaction rejected by XRPL: ${s.dispatched_result}. Make sure you open this page with the correct wallet.`,
          }))
        } else {
          await fetch('/api/artifact/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ offer_id: offer.offer_id }),
          })
          setClaimedIds(prev => new Set([...prev, offer.offer_id]))
          onClaimed?.()
        }
      } else if (s.expired || s.rejected) {
        clearInterval(intervalRef.current!)
        setQr(null)
        setSignUrl(null)
        setActiveOffer(null)
      }
    }, 2000)
  }

  const cancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setQr(null)
    setSignUrl(null)
    setActiveOffer(null)
  }

  const skip = (offerId: string) => {
    setSkippedIds(prev => new Set([...prev, offerId]))
  }

  if (visible.length === 0 && claimedIds.size === 0) return null

  if (visible.length === 0 && claimedIds.size > 0) {
    return (
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-700">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {claimedIds.size === 1 ? 'Artifact claimed.' : `${claimedIds.size} artifacts claimed.`}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {claimedIds.size === 1 ? 'It now lives in your wallet.' : 'They now live in your wallet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {visible.map(offer => {
        const isActive = activeOffer === offer.offer_id
        const isBusy = activeOffer !== null && !isActive
        const artifactLabel = offer.artifact_type === 'winner' ? 'Winner' : 'Participant'
        const err = errors[offer.offer_id]

        return (
          <div
            key={offer.offer_id}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              {artifactLabel} Artifact
            </p>
            <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
              {offer.choice_point}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Expires {new Date(offer.expires_at).toLocaleDateString()}
            </p>

            {isActive && qr && signUrl ? (
              <div className="mt-3 flex flex-col items-center gap-3">
                <p className="text-xs text-zinc-500">Scan with Xaman to accept</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="Xaman claim QR" width={160} height={160} />
                <a
                  href={signUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 underline"
                >
                  Open in Xaman
                </a>
                <button onClick={cancel} className="text-xs text-zinc-400 underline">
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                  Xaman will show a warning — this is normal for free NFT transfers. No XRP will leave your wallet.
                </p>
                {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => claim(offer)}
                    disabled={isBusy}
                    className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => skip(offer.offer_id)}
                    disabled={isBusy}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
                  >
                    Skip
                  </button>
                </div>
              </>
            )}
          </div>
        )
      })}

      {claimedIds.size > 0 && (
        <p className="text-center text-xs text-zinc-500">
          {claimedIds.size === 1 ? '1 artifact claimed this session.' : `${claimedIds.size} artifacts claimed this session.`}
        </p>
      )}
    </div>
  )
}
