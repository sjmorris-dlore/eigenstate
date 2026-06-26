import { GetCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo } from '@/lib/dynamo'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const choicePoint = url.searchParams.get('choice_point')

  if (!choicePoint) {
    return Response.json({ error: 'choice_point is required' }, { status: 400 })
  }

  const result = await dynamo.send(new GetCommand({
    TableName: 'eigenthrope_chapters',
    Key: { choice_point: choicePoint },
  }))

  if (!result.Item) {
    return Response.json({ error: 'Chapter not found' }, { status: 404 })
  }

  return Response.json(result.Item)
}
