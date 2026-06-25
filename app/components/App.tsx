'use client'

import { useState } from 'react'
import WalletConnect from './WalletConnect'
import ArtifactClaim from './ArtifactClaim'
import Vote from './Vote'
import Tally from './Tally'

export default function App() {
  const [account, setAccount] = useState<string | null>(null)

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <WalletConnect onAccountChange={setAccount} />
      {account && <ArtifactClaim account={account} />}
      {account && <Vote account={account} />}
      <Tally />
    </div>
  )
}
