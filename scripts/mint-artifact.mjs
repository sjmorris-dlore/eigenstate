/**
 * Usage:
 *   node scripts/mint-artifact.mjs \
 *     --choice-point U001:C01:CP1 \
 *     --uri https://example.com/artifact.png
 *
 * Yield is computed dynamically from vote distribution (Quantum Yield mechanic):
 *   50/50 split → 25% of winners receive artifacts (MAX_YIELD)
 *   100/0 split → 5%  of winners receive artifacts (MIN_YIELD)
 *
 * Requires in .env.local:
 *   EIGENTHROPE_VAULT_SECRET — seed/secret for the vault wallet
 *   EIGENTHROPE_VAULT_ADDRESS
 *   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
 */

import { Client, Wallet } from 'xrpl'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { config } from 'dotenv'

config({ path: '.env.local' })

const XRPL_WS = 'wss://xrplcluster.com/'
const ARTIFACT_TAXON = 1
const SOURCE_TAG = 2606230005
const MAX_YIELD = 0.25
const MIN_YIELD = 0.05
const CHOICE_POINT = getArg('--choice-point')

// p = winning fraction of total weighted votes (0.5–1.0)
function computeYield(p) {
  const t = Math.max(0, Math.min(1, (p - 0.5) * 2))
  return MIN_YIELD + (MAX_YIELD - MIN_YIELD) * (1 - t)
}
const IMAGE_URI = getArg('--uri')
const OFFER_EXPIRY_DAYS = 7

function getArg(flag) {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 ? process.argv[idx + 1] : null
}

if (!CHOICE_POINT || !IMAGE_URI) {
  console.error('Usage: node scripts/mint-artifact.mjs --choice-point U001:C01:CP1 --uri https://...')
  process.exit(1)
}

const vaultSecret = process.env.EIGENTHROPE_VAULT_SECRET
const vaultAddress = process.env.EIGENTHROPE_VAULT_ADDRESS?.trim()
if (!vaultSecret || !vaultAddress) {
  console.error('EIGENTHROPE_VAULT_SECRET and EIGENTHROPE_VAULT_ADDRESS must be set in .env.local')
  process.exit(1)
}

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
}))

function fromHex(hex) {
  return Buffer.from(hex, 'hex').toString('utf8')
}

function toHex(str) {
  return Buffer.from(str, 'utf8').toString('hex').toUpperCase()
}

async function getVotersByChoice(client, vaultAddress, choicePoint) {
  const [universe, chapter, cp] = choicePoint.split(':')
  const res = await client.request({
    command: 'account_tx',
    account: vaultAddress,
    limit: 400,
  })

  const transactions = res.result?.transactions ?? []
  const latestVote = {}

  for (const entry of transactions) {
    const tx = entry.tx_json ?? entry.tx
    if (!tx || tx.TransactionType !== 'Payment') continue
    const sender = tx.Account?.trim()
    if (!sender || latestVote[sender]) continue

    const memos = tx.Memos
    if (!memos) continue

    for (const { Memo } of memos) {
      if (!Memo.MemoData) continue
      try {
        const vote = JSON.parse(fromHex(Memo.MemoData))
        if (vote.universe === universe && vote.chapter === chapter && vote.choice_point === cp) {
          latestVote[sender] = { choice: vote.choice, weight: vote.weight ?? 1 }
        }
      } catch { /* skip */ }
    }
  }

  // Group wallets and sum weights by choice
  const byChoice = {}
  for (const [wallet, { choice, weight }] of Object.entries(latestVote)) {
    if (!byChoice[choice]) byChoice[choice] = { wallets: [], totalWeight: 0 }
    byChoice[choice].wallets.push(wallet)
    byChoice[choice].totalWeight += weight
  }
  return byChoice
}

function randomSubset(arr, pct) {
  const count = Math.max(1, Math.floor(arr.length * pct))
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

async function getOfferIdFromResult(result) {
  const nodes = result.result.meta?.AffectedNodes ?? []
  for (const node of nodes) {
    if (node.CreatedNode?.LedgerEntryType === 'NFTokenOffer') {
      return node.CreatedNode.LedgerIndex
    }
  }
  throw new Error('Could not find offer ID in transaction result')
}

const client = new Client(XRPL_WS)
await client.connect()

const wallet = Wallet.fromSeed(vaultSecret)
console.log(`Vault wallet: ${wallet.address}`)

const byChoice = await getVotersByChoice(client, vaultAddress, CHOICE_POINT)
console.log('\nVoters by choice:')
for (const [choice, { wallets, totalWeight }] of Object.entries(byChoice)) {
  console.log(`  ${choice}: ${wallets.length} voter(s), weight ${totalWeight.toFixed(2)}`)
}

if (Object.keys(byChoice).length === 0) {
  console.error('No votes found for this choice point.')
  await client.disconnect()
  process.exit(1)
}

// Determine winning choice by total weight
const winningChoice = Object.entries(byChoice)
  .sort((a, b) => b[1].totalWeight - a[1].totalWeight)[0][0]
const { wallets: winners, totalWeight: winnerWeight } = byChoice[winningChoice]
const totalWeight = Object.values(byChoice).reduce((s, v) => s + v.totalWeight, 0)

// Quantum yield: NFT rate scales with vote divergence
// 50/50 → MAX_YIELD, 100/0 → MIN_YIELD
const p = winnerWeight / totalWeight
const yieldPct = computeYield(p)
console.log(`\nWinning choice: ${winningChoice} (weight ${winnerWeight.toFixed(2)} / ${totalWeight.toFixed(2)} = ${Math.round(p * 100)}% consensus)`)
console.log(`Quantum yield: ${Math.round(yieldPct * 100)}% of winners receive artifacts`)

const selected = randomSubset(winners, yieldPct)
console.log(`Minting artifacts for ${selected.length} of ${winners.length} winners:\n`)

const uriHex = toHex(IMAGE_URI)
const expiresAt = new Date(Date.now() + OFFER_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

for (const winner of selected) {
  console.log(`  Minting for ${winner}...`)

  // 1. Mint NFT
  const mintResult = await client.submitAndWait({
    TransactionType: 'NFTokenMint',
    Account: wallet.address,
    URI: uriHex,
    Flags: 8, // tfTransferable
    NFTokenTaxon: ARTIFACT_TAXON,
    SourceTag: SOURCE_TAG,
  }, { wallet })

  const nftTokenId = mintResult.result.meta?.nftoken_id
  if (!nftTokenId) {
    console.error(`  Failed to get NFTokenID for ${winner}, skipping`)
    continue
  }
  console.log(`  Minted: ${nftTokenId}`)

  // 2. Create sell offer (0 XRP) to this winner only
  const offerResult = await client.submitAndWait({
    TransactionType: 'NFTokenCreateOffer',
    Account: wallet.address,
    NFTokenID: nftTokenId,
    Amount: '0',
    Destination: winner,
    Flags: 1, // tfSellNFToken
    SourceTag: SOURCE_TAG,
  }, { wallet })

  const offerId = await getOfferIdFromResult(offerResult)
  console.log(`  Offer: ${offerId}`)

  // 3. Store in DynamoDB
  await dynamo.send(new PutCommand({
    TableName: 'eigenthrope_artifacts',
    Item: {
      offer_id: offerId,
      nft_token_id: nftTokenId,
      choice_point: CHOICE_POINT,
      winner_address: winner,
      winning_choice: winningChoice,
      nft_uri: IMAGE_URI,
      status: 'pending',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    },
  }))
  console.log(`  Stored. Expires: ${expiresAt}\n`)
}

await client.disconnect()
console.log('Done.')
