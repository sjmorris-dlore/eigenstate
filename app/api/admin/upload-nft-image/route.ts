import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo } from '@/lib/dynamo'

export async function POST(request: Request) {
  const form = await request.formData()
  const file = form.get('file') as File | null
  const choicePoint = form.get('choice_point') as string | null
  const type = form.get('type') as string | null

  if (!file || !choicePoint || !type) {
    return Response.json({ error: 'file, choice_point, and type are required' }, { status: 400 })
  }

  if (type !== 'winner' && type !== 'participation') {
    return Response.json({ error: 'type must be winner or participation' }, { status: 400 })
  }

  const jwt = process.env.PINATA_JWT
  if (!jwt) {
    return Response.json({ error: 'PINATA_JWT not configured' }, { status: 500 })
  }

  const pinataForm = new FormData()
  pinataForm.append('file', file)
  pinataForm.append('pinataMetadata', JSON.stringify({
    name: `${choicePoint}-${type}-${Date.now()}`,
  }))

  const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: pinataForm,
  })

  if (!pinataRes.ok) {
    const err = await pinataRes.text()
    return Response.json({ error: `Pinata error: ${err}` }, { status: 500 })
  }

  const { IpfsHash: cid } = await pinataRes.json() as { IpfsHash: string }
  const uri = `ipfs://${cid}`

  const field = type === 'winner' ? 'winner_nft_uri' : 'participation_nft_uri'
  await dynamo.send(new UpdateCommand({
    TableName: 'eigenthrope_chapters',
    Key: { choice_point: choicePoint },
    UpdateExpression: `SET ${field} = :uri`,
    ExpressionAttributeValues: { ':uri': uri },
  }))

  return Response.json({ uri, cid, gateway_url: `https://gateway.pinata.cloud/ipfs/${cid}` })
}
