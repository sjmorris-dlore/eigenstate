import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo } from '@/lib/dynamo'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const choicePoint = url.searchParams.get('choice_point')
  if (!choicePoint) return Response.json({ error: 'choice_point required' }, { status: 400 })

  const result = await dynamo.send(new QueryCommand({
    TableName: 'eigenthrope_minting',
    IndexName: 'choice_point-index',
    KeyConditionExpression: 'choice_point = :cp',
    ExpressionAttributeValues: { ':cp': choicePoint },
  }))

  const items = result.Items ?? []
  const minted = items.filter(i => i.status === 'minted').length
  const offered = items.filter(i => i.status === 'offered').length
  const total = items.length

  return Response.json({ total, minted, offered })
}
