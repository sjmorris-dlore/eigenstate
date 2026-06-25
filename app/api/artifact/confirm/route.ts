import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo } from '@/lib/dynamo'

export async function POST(request: Request) {
  const { offer_id } = await request.json()

  if (!offer_id) {
    return Response.json({ error: 'offer_id required' }, { status: 400 })
  }

  await dynamo.send(new UpdateCommand({
    TableName: 'eigenthrope_artifacts',
    Key: { offer_id },
    UpdateExpression: 'SET #s = :claimed, claimed_at = :now',
    ConditionExpression: '#s = :pending',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':claimed': 'claimed',
      ':pending': 'pending',
      ':now': new Date().toISOString(),
    },
  }))

  return Response.json({ ok: true })
}
