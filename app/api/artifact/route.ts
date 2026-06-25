import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo } from '@/lib/dynamo'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const account = searchParams.get('account')?.trim()

  if (!account) {
    return Response.json({ error: 'account required' }, { status: 400 })
  }

  const result = await dynamo.send(new QueryCommand({
    TableName: 'eigenthrope_artifacts',
    IndexName: 'winner_address-index',
    KeyConditionExpression: 'winner_address = :addr',
    FilterExpression: '#s = :pending',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':addr': account,
      ':pending': 'pending',
    },
  }))

  const items = (result.Items ?? []).filter(
    item => new Date(item.expires_at) > new Date()
  )

  return Response.json({ claims: items })
}
