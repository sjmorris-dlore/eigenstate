/**
 * Cancels NFT sell offers that have passed their expiry date.
 * Run weekly (or after each story beat).
 *
 * Usage: node scripts/cancel-expired-offers.mjs
 */

import { Client, Wallet } from 'xrpl'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { config } from 'dotenv'

config({ path: '.env.local' })

const XRPL_WS = 'wss://xrplcluster.com/'
const SOURCE_TAG = 2606230005

const vaultSecret = process.env.EIGENTHROPE_VAULT_SECRET
if (!vaultSecret) {
  console.error('EIGENTHROPE_VAULT_SECRET must be set in .env.local')
  process.exit(1)
}

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
}))

// Find all pending offers past their expiry
const scan = await dynamo.send(new ScanCommand({
  TableName: 'eigenthrope_artifacts',
  FilterExpression: '#s = :pending',
  ExpressionAttributeNames: { '#s': 'status' },
  ExpressionAttributeValues: { ':pending': 'pending' },
}))

const now = new Date()
const expired = (scan.Items ?? []).filter(item => new Date(item.expires_at) < now)

if (expired.length === 0) {
  console.log('No expired offers to cancel.')
  process.exit(0)
}

console.log(`Found ${expired.length} expired offer(s). Cancelling...`)

const client = new Client(XRPL_WS)
await client.connect()
const wallet = Wallet.fromSeed(vaultSecret)

for (const item of expired) {
  console.log(`  Cancelling offer ${item.offer_id} for ${item.winner_address}...`)
  try {
    await client.submitAndWait({
      TransactionType: 'NFTokenCancelOffer',
      Account: wallet.address,
      NFTokenOffers: [item.offer_id],
      SourceTag: SOURCE_TAG,
    }, { wallet })

    await dynamo.send(new UpdateCommand({
      TableName: 'eigenthrope_artifacts',
      Key: { offer_id: item.offer_id },
      UpdateExpression: 'SET #s = :expired',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':expired': 'expired' },
    }))
    console.log(`  Done.\n`)
  } catch (err) {
    console.error(`  Failed: ${err.message}\n`)
  }
}

await client.disconnect()
console.log('Done.')
