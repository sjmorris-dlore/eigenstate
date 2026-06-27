import { DeleteCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo } from '@/lib/dynamo'
import { getResetVersion, setResetVersion } from '@/lib/config'

export async function POST() {
  const currentRv = await getResetVersion()
  const newRv = currentRv + 1

  const tallies = await dynamo.send(new ScanCommand({
    TableName: 'eigenthrope_tallies',
    ProjectionExpression: 'choice_point',
  }))

  await Promise.all([
    setResetVersion(newRv),

    // Clear active chapter so site goes dormant
    dynamo.send(new UpdateCommand({
      TableName: 'eigenthrope_config',
      Key: { key: 'active_choice_point' },
      UpdateExpression: 'REMOVE #v',
      ExpressionAttributeNames: { '#v': 'value' },
    })),

    // Delete all tally caches
    ...(tallies.Items ?? []).map(item =>
      dynamo.send(new DeleteCommand({
        TableName: 'eigenthrope_tallies',
        Key: { choice_point: item.choice_point },
      }))
    ),
  ])

  return Response.json({
    ok: true,
    reset_version: newRv,
    winner_taxon: 1000 + newRv,
    participation_taxon: 2000 + newRv,
  })
}
