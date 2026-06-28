import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Eigenthrope',
}

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16 sm:px-8 dark:bg-black">
      <main className="w-full max-w-2xl space-y-10 text-zinc-700 dark:text-zinc-300">

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">Eigenthrope</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Terms of Service</h1>
          <p className="mt-2 text-sm text-zinc-400">Last updated: June 2026</p>
        </div>

        <section className="space-y-4">
          <p>
            By connecting your wallet and participating in Eigenthrope, you agree to these terms.
            If you do not agree, do not use the game.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">What Eigenthrope is</h2>
          <p className="text-sm leading-7">
            Eigenthrope is a collaborative storytelling game played on the XRP Ledger. Participants
            read chapters of an ongoing mystery and cast votes that shape the story's direction.
            Votes and outcomes are recorded on-chain. The game is intended for entertainment purposes only.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Vote transactions</h2>
          <p className="text-sm leading-7">
            Casting a vote sends 1 drop of XRP (0.000001 XRP) to the Eigenthrope game vault and
            pays the standard XRP Ledger network fee shown in Xaman before you sign. This is the
            full cost of voting. The drop is not refundable. By signing a vote transaction you are
            permanently recording your choice on the XRP Ledger.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">NFT artifacts</h2>
          <p className="text-sm leading-7">
            At the end of each chapter, eligible participants may receive NFT artifacts as
            recognition of their participation. These are issued as free gifts from the game vault —
            accepting an artifact costs no XRP beyond the standard XRPL network fee.
            NFT artifacts are digital collectibles with no guaranteed monetary value. They are not
            financial instruments, securities, or investments.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Your wallet and keys</h2>
          <p className="text-sm leading-7">
            You are solely responsible for your XRPL wallet, private keys, and secret recovery
            phrase. Eigenthrope never requests, stores, or has access to your private key or seed.
            All transaction signing happens inside the Xaman app on your device. We cannot reverse
            or recover any transaction you sign.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Not financial advice</h2>
          <p className="text-sm leading-7">
            Nothing in Eigenthrope constitutes financial, investment, or legal advice. XRP and
            XRPL-based assets carry risk. Participate only with amounts you are comfortable with.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Game changes and availability</h2>
          <p className="text-sm leading-7">
            We may update, pause, or end the game at any time. Chapter rules, resonance scoring,
            and artifact eligibility may change between seasons. We are not liable for any loss
            arising from game changes, downtime, or discontinuation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Acceptable use</h2>
          <p className="text-sm leading-7">
            You may not attempt to manipulate votes, exploit the game mechanics, or use automated
            tools to interact with the game. We reserve the right to disqualify wallets found to
            be acting in bad faith.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Limitation of liability</h2>
          <p className="text-sm leading-7">
            Eigenthrope is provided as-is. To the fullest extent permitted by law, we are not
            liable for any damages arising from your use of the game, including loss of XRP,
            loss of access to artifacts, or any other loss related to XRPL transactions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Contact</h2>
          <p className="text-sm leading-7">
            Questions about these terms: <a href="mailto:info@sjmorriswrites.com" className="underline hover:text-zinc-900 dark:hover:text-zinc-50">info@sjmorriswrites.com</a>
          </p>
        </section>

      </main>
    </div>
  )
}
