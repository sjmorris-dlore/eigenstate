/**
 * Resets the story for a new test run.
 *
 * - Increments reset_version in DynamoDB config (old chain votes become invisible)
 * - Reopens the chapter so voting can happen again
 * - Busts the tally cache
 *
 * Old blockchain data is preserved — the reset_version stamp in vote memos
 * means the app simply ignores votes from previous runs.
 *
 * Usage:
 *   node scripts/reset-story.mjs --choice-point U001:C01:CP1
 *   node scripts/reset-story.mjs --choice-point U001:C01:CP1 --voting-hours 48
 *
 * Default voting window after reset: 24 hours.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { config } from 'dotenv'

config({ path: '.env.local' })

function getArg(flag) {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 ? process.argv[idx + 1] : null
}

const CHOICE_POINT   = getArg('--choice-point')
const VOTING_HOURS   = parseInt(getArg('--voting-hours') ?? '24', 10)

if (!CHOICE_POINT) {
  console.error('Usage: node scripts/reset-story.mjs --choice-point U001:C01:CP1 [--voting-hours 24]')
  process.exit(1)
}

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
}))

// 1. Read current reset_version
const configItem = await dynamo.send(new GetCommand({
  TableName: 'eigenthrope_config',
  Key: { key: 'reset_version' },
}))
const currentVersion = typeof configItem.Item?.value === 'number' ? configItem.Item.value : 0
const newVersion = currentVersion + 1

// 2. Write new reset_version
await dynamo.send(new PutCommand({
  TableName: 'eigenthrope_config',
  Item: { key: 'reset_version', value: newVersion },
}))
console.log(`reset_version: ${currentVersion} → ${newVersion}`)
console.log(`  Winner taxon:        ${1000 + newVersion}`)
console.log(`  Participation taxon: ${2000 + newVersion}`)

// 3. Reopen the chapter
const newDeadline = new Date(Date.now() + VOTING_HOURS * 60 * 60 * 1000).toISOString()
await dynamo.send(new UpdateCommand({
  TableName: 'eigenthrope_chapters',
  Key: { choice_point: CHOICE_POINT },
  UpdateExpression: `
    SET #s = :open, voting_closes_at = :deadline
    REMOVE closed_at, winning_choice, final_tally, final_yield_pct
  `,
  ExpressionAttributeNames: { '#s': 'status' },
  ExpressionAttributeValues: {
    ':open': 'open',
    ':deadline': newDeadline,
  },
}))
console.log(`\nReopened chapter: ${CHOICE_POINT}`)
console.log(`  Voting closes: ${newDeadline}`)

// 4. Bust tally cache
try {
  await dynamo.send(new DeleteCommand({
    TableName: 'eigenthrope_tallies',
    Key: { choice_point: CHOICE_POINT },
  }))
  console.log('\nTally cache cleared.')
} catch {
  console.log('\nNo tally cache to clear.')
}

console.log('\nReset complete. Old votes remain on-chain but will be ignored.')
console.log('New votes will carry rv=' + newVersion + ' in their memos.')
