import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb'
import { config } from 'dotenv'

config({ path: '.env.local' })

const client = new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const result = await client.send(new CreateTableCommand({
  TableName: 'eigenthrope_artifacts',
  BillingMode: 'PAY_PER_REQUEST',
  AttributeDefinitions: [
    { AttributeName: 'offer_id', AttributeType: 'S' },
    { AttributeName: 'winner_address', AttributeType: 'S' },
  ],
  KeySchema: [
    { AttributeName: 'offer_id', KeyType: 'HASH' },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'winner_address-index',
      KeySchema: [{ AttributeName: 'winner_address', KeyType: 'HASH' }],
      Projection: { ProjectionType: 'ALL' },
    },
  ],
}))

console.log('Created:', result.TableDescription.TableName)
