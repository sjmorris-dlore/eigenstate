# Eigenstate — Design Document

*Technical and mechanical reference — updated as architecture evolves*

---

## The Core Loop

1. A story chapter is published with a branching choice
2. Players connect their XRPL wallet and submit a vote as a transaction
3. Weighted votes determine the outcome
4. The selected outcome updates universe state and community knowledge state
5. The next chapter is authored from the current state, not from a prewritten branch tree
6. Eventually the universe collapses and a new one begins
7. Player participation weights and accumulated knowledge carry forward across universes

---

## Authoring Model: State-Driven, Not Branch-Tree

Eigenstate should not be authored as a traditional branching tree.

Traditional CYOA structure creates exponential writing burden:

```
Chapter 1
├── Choice A
│   ├── Chapter 2A
│   └── Chapter 2B
└── Choice B
    ├── Chapter 2C
    └── Chapter 2D
```

Eigenstate should instead work as a **state-driven mystery engine**.

Each vote updates the current state of the universe. The author then writes the next chapter based on that state.

The question is not:

> Which branch are we on?

The question is:

> Given what happened, what is the most interesting next chapter?

This keeps the game sustainable while preserving meaningful consequences.

### Current Reality, Not Branch Path

The backend should track the current state of reality, not an ever-expanding branch tree.

Example:

```
Universe: U001 — 1963 Bank Robbery

Immutable Facts:
- Hero chased the fleeing man
- Antagonist escaped
- Archive remained unsecured
- Woman stayed at the scene

Knowledge State:
- Antagonist predicted Hero: true
- Archive target identified: false
- Photograph thread: state 1
- Woman anomaly thread: state 0
```

The next chapter is written from this state.

The exact path that produced the state remains available in the archive and on-chain voting history, but the author does not need to maintain a separate branch for every possible route.

### Two Kinds of State

Eigenstate should distinguish between **story facts** and **community knowledge**.

#### Immutable Story Facts

Facts are things that happened in the current universe.

Examples:

- The Hero chased the Antagonist
- The Woman saw the photograph
- The vault was opened
- The police blamed the Hero
- The Antagonist escaped with the file

Facts are authored consequences of winning choices. They shape the current universe.

#### Community Knowledge State

Knowledge state represents what the community has learned across all universes.

Examples:

- `CLUE_PHOTOGRAPH_001` advanced to state 2
- `THREAD_WOMAN_ANOMALY` discovered
- `THREAD_ANTAGONIST_PREDICTION` active
- `THREAD_OBSERVER` dormant

Knowledge state carries forward across universes and is the real long-term progression system.

### Chapter Authoring Workflow

After each vote resolves, the authoring workflow should be:

1. Record the winning choice on-chain and in application state
2. Update immutable facts for the current universe
3. Update any clue or mystery-thread states revealed by the outcome
4. Review current universe facts and accumulated knowledge
5. Write the next chapter based on the current state
6. Present the next meaningful choice

This is closer to running a tabletop RPG campaign than writing a fixed branching novel.

The author understands:

- the characters
- the current universe
- the hidden cosmology
- the mystery threads
- the consequences of prior votes

The community creates the plot through decisions.

### Design Principle

Eigenstate requires **more planning of the world** and **less planning of the plot**.

The cosmology, mystery threads, major clue states, and endgame should be planned.

Individual chapter paths should remain flexible and reactive.

The story is discovered through play.

---

## Player Identity & Registration

- Players connect via **Xaman** wallet (mobile-friendly, handles transaction signing)
- Wallet address = player identity
- No email, no signup form, no password
- First wallet connection = genesis (participation history begins from zero)
- Identity is self-sovereign — Eigenstate never holds keys

---

## Participation & Vote Weight

### The Core Principle
Influence is earned through participation, not purchased or inherited. This is a judgment economy, not a follower economy.

### How Weight Accumulates
- Every player begins with equal base weight
- Each vote cast increments participation history
- Weight is a function of total votes cast across all universes
- Long-term players carry more narrative gravity than newcomers

### Why Not Social Media Follower Count?
- Follower counts are trivially faked via bot farms
- Engagement rate is a better signal but still platform-dependent and API-gated
- On-chain participation history is verifiable, platform-agnostic, and trustless
- Keeps the entire system self-contained on XRPL

### Thematic Framing
Player weight should be surfaced in the UI under a mythologically consistent name. Candidates:
- Resonance
- Observation Strength
- Eigenweight
- Narrative Gravity

Players are not accumulating voting power. They are becoming stronger observers.

---

## Voting Mechanics

### Vote Submission
Each vote is an XRPL Payment transaction with a structured Memo containing:

```
{
  "universe": "U001",
  "chapter": "C01",
  "choice_point": "CP1",
  "choice": "A",
  "weight": 1.0
}
```

- `universe` — identifier for the current universe
- `chapter` — chapter within the universe
- `choice_point` — specific decision being voted on
- `choice` — the option selected (A, B, etc.)
- `weight` — player's participation weight at time of vote

### On-Chain Transparency
Every vote is permanently recorded on the XRP Ledger. The full path of every universe — every choice the community made, every clue discovered or missed, every collapse — is readable from the chain. Nothing is hidden. Nothing can be altered retroactively.

### Vote Tallying
- Backend reads submitted transactions for the current choice point
- Applies participation weights
- Determines outcome when either a threshold or timer condition is met
- Updates story state in database
- Marks choice point as closed

---

## The Clue Pool

### Structure
The deeper mythology is revealed through discoverable clues embedded in story branches. Community choices determine which clues surface.

- Once a clue is discovered it is **permanently removed** from the pool
- It becomes part of the community's accumulated knowledge
- It may be referenced in future universes but is never re-discoverable
- The pool itself is hidden — players do not know its size or contents

### Why Hidden?
A known pool reveals the shape of the mystery through its gaps. Players would reverse-engineer the mythology from missing entries. The hidden pool creates an archaeological experience — the community doesn't just fill in blanks, they figure out what the blanks even are.

### Clue Dependencies
Some deeper clues only become accessible after prerequisite clues have been discovered. This creates a natural pacing mechanism and rewards long-term community knowledge.

### Clues as Evolving Objects

Clues are not just facts — they are *objects* with a life across universes. A physical item (a photograph, a document, a scar) can appear in multiple states depending on where and when in the multiverse the community is observing it.

**Example:** A photograph exists in Universe 1 with a face burned away. In a later universe set earlier in time, the photograph is intact — and a subsequent chapter shows the moment it was taken. The object is the same; the community's knowledge of it deepens across universes.

This creates an archaeological dynamic: the community doesn't just collect clues, they *understand* them more deeply over time.

#### Clue Status
- `dormant` — not yet reachable; prerequisites not met or universe hasn't opened the path
- `active` — available to be discovered through the right community choice
- `discovered` — found by the community; now part of accumulated knowledge

#### Clue Schema (DynamoDB: `eigenthrope_clues`)

```
PK: clue_id            e.g. "CLUE_PHOTOGRAPH_001"
- name                 "The Photograph"
- status               "dormant" | "active" | "discovered"
- state_description    Authored free text describing the object's current observed state.
                       This is what the community sees. Updated by the author as the
                       story evolves across universes.
                       e.g. "A black and white photograph of three people.
                             The face on the right has been burned away."
- appearances          Array of planned appearances (author planning tool, not exposed to players):
                       [
                         { universe, chapter, condition, state, note },
                         ...
                       ]
                       e.g. { universe: "U001", chapter: "C02",
                              condition: "choice A wins",
                              state: "burned",
                              note: "found in the Antagonist's desk" }
- prerequisite_clues   ["CLUE_DARKROOM_001"] — clues that must be discovered first
- choice_path          Which choice reveals this clue, e.g. "U001:C01:CP1:A"
- discovered_at        ISO timestamp | null
- discovered_in_universe  "U001" | null
```

#### Discovered Clues (DynamoDB: `eigenthrope_discoveries`)

Separate table — safe to expose to players. Contains only discovered clues with their current `state_description`. The hidden pool (`eigenthrope_clues`) is never queried from the frontend directly.

#### Key Design Rules
- The pool size is never revealed — players cannot know how many clues remain
- `state_description` is the author's voice; it evolves as the author writes new universe chapters
- An object's state history (burned → whole → photographed) is the narrative arc, not player-facing state machine transitions
- Prerequisite dependencies create natural pacing and reward long-term community knowledge

---

## Universe Lifecycle

### A Universe Ends When:
- A collapse condition is met (community makes enough wrong turns)
- The story reaches its natural conclusion for that universe

### Collapse Is Canon
A collapse is not a failure state. It is built into the mythology — the Eigenthropes slip to a new eigenstate, relationships reset, a new crisis emerges. Players carry their accumulated knowledge forward. Characters do not.

### What Carries Forward
- Player participation weights (accumulate across all universes)
- Discovered clues (permanently in the community's knowledge base)
- The on-chain record of all choices made

### What Resets
- Story state
- Character relationships and memory
- Available clue branches (new universe, new pool — but previously discovered clues never return)

---

## Chapter Design Rule

Every chapter must advance all three narrative scales:

| Scale | Description | Example |
|---|---|---|
| Immediate | Something happens in the current narrative | The Hero escapes |
| Mysterious | Something strange is revealed | The Woman knows a detail she shouldn't |
| Mythological | Something advances the larger cosmology | The Antagonist reacts to an object from a previous universe |

A chapter advancing only one scale loses player investment. All three keeps players engaged in both the current story and the larger mystery.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) |
| Hosting | Vercel |
| Domain | eigenstate.sjmorriswrites.com |
| DNS | Squarespace CNAME → Vercel |
| Wallet connection | Xaman |
| Blockchain | XRP Ledger (mainnet) |
| Vote recording | XRPL Payment transactions with Memo |
| Application state | DynamoDB (AWS) |
| Backend logic | AWS Lambda + Vercel serverless functions |
| Language | TypeScript |
| XRPL library | xrpl.js |

---

## Infrastructure Notes

- DynamoDB is existing infrastructure — same AWS account as Growthbot/Adsbot
- Story state lives in DynamoDB; the chain is the audit trail, not the source of truth for the UI
- Backend vote tallying can run as a Lambda on a timer or triggered by transaction webhook
- All campaigns/universes default to a defined source tag for hackathon leaderboard tracking

---

## Repository

**GitHub:** https://github.com/sjmorris-dlore/eigenthrope

### File Structure (planned)
```
/
├── README.md           — Project overview and pitch
├── DESIGN.md           — This document
├── STORY.md            — Narrative and story development
├── /app                — Next.js application
├── /lambda             — AWS Lambda functions
└── /scripts            — Utility scripts
```

---

## Hackathon Requirements Checklist

- [ ] Source tag assigned by XRPL Commons — add to all mainnet transactions
- [ ] Mainnet validation meeting booked
- [ ] At least one mainnet transaction with source tag recorded
- [ ] Demo video (YouTube, Vimeo, or Loom)
- [ ] Public GitHub repository URL submitted
- [ ] Short description (200 chars max)
- [ ] Full description (5000 chars max)
- [ ] Technical description (1000 chars max)
- [ ] Submission deadline: **July 23, 2026**

---

## Open Technical Questions

1. Vote advancement trigger — timer-based or vote-threshold-based?
2. How many choice points per chapter?
3. Minimum participation weight for a vote to count?
4. How to handle simultaneous votes during tallying (race conditions)
5. Whether to expose a public API for community-built tools (wikis, trackers)
6. Mobile experience — Xaman deep links vs. QR code flow
7. What fields should the Author Dashboard expose for immutable facts vs. community knowledge state?
8. How much of the public archive should be generated automatically from DB state vs. authored manually?

---

*Last updated: June 24, 2026*
