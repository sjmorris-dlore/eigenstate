import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo } from '@/lib/dynamo'

export interface LibraryChapter {
  choice_point: string
  universe: string
  chapter: string
  chapter_label: string
  winner_nft_uri?: string
  participation_nft_uri?: string
}

export async function GET() {
  const result = await dynamo.send(new ScanCommand({
    TableName: 'eigenthrope_chapters',
    ProjectionExpression: 'choice_point, universe, chapter, chapter_label, winner_nft_uri, participation_nft_uri',
  }))

  const chapters = ((result.Items ?? []) as LibraryChapter[])
    .sort((a, b) => a.choice_point.localeCompare(b.choice_point))

  return Response.json(chapters)
}
