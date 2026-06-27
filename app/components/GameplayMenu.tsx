'use client'

export default function GameplayMenu() {
  return (
    <details className="group relative">
      <summary className="cursor-pointer list-none text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
        Gameplay
      </summary>

      <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <div className="space-y-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">1. Read the chapter</p>
            <p className="mt-1">Each chapter presents a moment where the community&apos;s choices shape what happens next. Read, then connect your Xaman wallet to cast your observation.</p>
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">2. Vote</p>
            <p className="mt-1">Your vote is signed with your wallet and woven permanently into the XRP Ledger. You can change your mind and vote again — votes cannot be removed from the ledger, but only your most recent vote counts toward the outcome.</p>
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">3. Earn an Observer Artifact</p>
            <p className="mt-1">When voting closes, observers who chose the winning option are eligible to receive an Observer Artifact — an NFT minted on the XRP Ledger. A close vote produces more artifacts; a landslide produces fewer.</p>
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">4. Build Resonance</p>
            <p className="mt-1">Each artifact you hold increases your Resonance — a measure of your accumulated influence. Higher Resonance gives your future votes more weight.</p>
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">5. Trade</p>
            <p className="mt-1">Artifacts are standard XRP Ledger NFTs. Hold them to build Resonance or trade them on any XRPL NFT marketplace.</p>
          </div>
        </div>
      </div>
    </details>
  )
}
