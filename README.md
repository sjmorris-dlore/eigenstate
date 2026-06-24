# Eigenstate

**A community-driven parallel universe story game on the XRP Ledger**

---

## What is Eigenstate?

Eigenstate is a community-driven narrative game where players collectively steer a story across an endless chain of parallel universes.

Each chapter presents a choice.

Players vote on what happens next.

The community's decisions shape the fate of the current universe, revealing clues, relationships, and hidden truths. Eventually every universe ends — sometimes through triumph, sometimes through disaster, sometimes through choices whose consequences are not understood until much later.

When a universe ends, the characters forget.

The players do not.

The real progression of Eigenstate is not the survival of any single universe. It is the community's accumulated understanding of a deeper mystery unfolding across all of them.

Every vote is recorded transparently on the XRP Ledger, creating a permanent history of the community's influence on reality.

---

## The Eigenthropes

At the center of every universe are three beings: two men and one woman, each capable of slipping between eigenstates of reality — parallel universes separated by divergent choices and collapsed possibilities.

They are called **Eigenthropes** (from *eigen*, meaning "characteristic" or "self", and *thrope*, meaning "change" — as in lycanthrope). Like quantum particles, their state is only fixed when observed. Like travelers, they carry no memory of where they've been.

Their relationships shift with every universe. Friends. Enemies. Strangers. Lovers. Parent and child. The same three people, infinite configurations.

The players are not outside the story.

The players are part of the story.

---

## How the Game Works

### Participation Earns Influence

Every player starts equal. Influence is not purchased or inherited — it is accumulated through showing up.

- Connect your XRPL wallet to join
- Vote on story choices by submitting a transaction
- Your vote weight grows with your participation history
- Long-term players carry more narrative gravity than newcomers

This is not a follower economy. It is a judgment economy. Players who have consistently read the community well become its most powerful voices.

### Community Pathfinding

Each chapter presents the community with a decision.

Weighted votes determine which possibility becomes reality.

The community is not searching for a single "correct" path. Different choices reveal different consequences, relationships, and clues about the larger mystery.

Some universes last longer than others.

Some end in apparent victory.

Some end in catastrophe.

All eventually become part of the same larger story.


### On-Chain Transparency

Every vote is recorded as a transaction on the XRP Ledger with a memo encoding:

- The current universe identifier
- The chapter and choice point
- The player's wallet address
- The choice made
- The player's participation weight at time of vote

The full path of every universe — every choice the community made, every branch taken, every collapse — is permanently readable from the chain. Nothing is hidden. Nothing can be altered retroactively.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (Vercel) |
| Domain | eigenstate.sjmorriswrites.com |
| Wallet connection | Xaman |
| Blockchain | XRP Ledger (mainnet) |
| Vote recording | XRPL Payment transactions with Memo |
| State/DB | DynamoDB (AWS) |
| Backend logic | AWS Lambda / Vercel serverless functions |
| Source tag | *(assigned by XRPL Commons)* |

---

## Roadmap

### Hackathon Scope (v0.1)
- [ ] Wallet connection via Xaman
- [ ] Universe 1: first story with 3–4 choice points
- [ ] Vote submission as XRPL memo transactions
- [ ] Participation weight tracking
- [ ] On-chain vote history readable via block explorer
- [ ] Win/collapse conditions implemented

### Future
- AI-assisted narrative generation seeded from community voting history
- Multiple concurrent universes
- Cross-universe player reputation
- Token-based participation incentives
- Mobile-native experience

---

## About

Built for the **Building on the XRPL** hackathon hosted by [XRPL Commons](https://xrpl-commons.org), June–July 2026.

Story and concept by **S.J. Morris** — indie fantasy author of the *Guardian League* and *Thaumatropic Roots* series, set in the shared Fractured Arcana universe.

> *"The universe doesn't care which path you take. But the community does."*
