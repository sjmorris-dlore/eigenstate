/**
 * Clears all Eigenthrope DynamoDB tables for a clean reset between test and production runs.
 *
 * Usage: node scripts/reset.mjs --yes
 *
 * After reset:
 *   1. Update EIGENTHROPE_VAULT_ADDRESS in Vercel to your production vault wallet
 *   2. node scripts/seed-chapter-1.mjs
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { config } from 'dotenv'

config({ path: '.env.local' })

if (!process.argv.includes('--yes')) {
  console.error('⚠️  This will permanently delete ALL data from all Eigenthrope tables.')
  console.error('    Run with --yes to confirm.')
  process.exit(1)
}

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
}))

const TABLES = [
  { name: 'eigenthrope_chapters',  pk: 'choice_point' },
  { name: 'eigenthrope_config',    pk: 'key' },
  { name: 'eigenthrope_tallies',   pk: 'choice_point' },
  { name: 'eigenthrope_artifacts', pk: 'offer_id' },
]

async function clearTable(tableName, pkField) {
  let deleted = 0
  let lastKey = undefined

  do {
    const scan = await dynamo.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastKey,
    }))

    const items = scan.Items ?? []
    lastKey = scan.LastEvaluatedKey

    for (let i = 0; i < items.length; i += 25) {
      const batch = items.slice(i, i + 25).map(item => ({
        DeleteRequest: { Key: { [pkField]: item[pkField] } },
      }))
      await dynamo.send(new BatchWriteCommand({
        RequestItems: { [tableName]: batch },
      }))
    }

    deleted += items.length
  } while (lastKey)

  return deleted
}

console.log('Resetting Eigenthrope...\n')

for (const { name, pk } of TABLES) {
  process.stdout.write(`  ${name}... `)
  const count = await clearTable(name, pk)
  console.log(`${count} item(s) deleted.`)
}

console.log('\nDone. Next steps:')
console.log('  1. Update EIGENTHROPE_VAULT_ADDRESS in Vercel to the production vault wallet')
console.log('  2. node scripts/seed-chapter-1.mjs')
