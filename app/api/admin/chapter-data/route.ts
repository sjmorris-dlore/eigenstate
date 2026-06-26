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
  const body = await request.json() as {
    choice_point: string
    choices?: Record<string, { label: string; description: string }>
    prompt?: string
  }

  const { choice_point, choices, prompt } = body

  if (!choice_point || (!choices && prompt === undefined)) {
    return Response.json({ error: 'choice_point and at least one field required' }, { status: 400 })
  }

  const setParts: string[] = []
  const names: Record<string, string> = {}
  const values: Record<string, unknown> = {}

  if (choices) {
    setParts.push('choices = :choices')
    values[':choices'] = choices
  }
  if (prompt !== undefined) {
    setParts.push('#p = :prompt')
    names['#p'] = 'prompt'
    values[':prompt'] = prompt
  }

  await dynamo.send(new UpdateCommand({
    TableName: 'eigenthrope_chapters',
    Key: { choice_point },
    UpdateExpression: `SET ${setParts.join(', ')}`,
    ...(Object.keys(names).length ? { ExpressionAttributeNames: names } : {}),
    ExpressionAttributeValues: values,
  }))

  return Response.json({ ok: true })
}
