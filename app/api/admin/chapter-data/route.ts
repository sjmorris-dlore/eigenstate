import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
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

export async function PATCH(request: Request) {
  const { choice_point, choices } = await request.json() as {
    choice_point: string
    choices: Record<string, { label: string; description: string }>
  }

  if (!choice_point || !choices) {
    return Response.json({ error: 'choice_point and choices are required' }, { status: 400 })
  }

  await dynamo.send(new UpdateCommand({
    TableName: 'eigenthrope_chapters',
    Key: { choice_point },
    UpdateExpression: 'SET choices = :choices',
    ExpressionAttributeValues: { ':choices': choices },
  }))

  return Response.json({ ok: true })
}
