const SOURCE_TAG = 2606230005

export async function POST(request: Request) {
  const { account, nft_token_id } = await request.json() as {
    account: string
    nft_token_id: string
  }

  if (!account || !nft_token_id) {
    return Response.json({ error: 'account and nft_token_id required' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_XAMAN_API_KEY
  const apiSecret = process.env.XAMAN_API_SECRET
  if (!apiKey || !apiSecret) {
    return Response.json({ error: 'Xaman credentials not configured' }, { status: 500 })
  }

  const payload = {
    txjson: {
      TransactionType: 'NFTokenBurn',
      Account: account.trim(),
      NFTokenID: nft_token_id,
      SourceTag: SOURCE_TAG,
    },
    custom_meta: {
      identifier: 'eigenthrope_burn',
      instruction: 'Permanently destroy this Eigenthrope artifact. This cannot be undone.',
    },
    options: {
      submit: true,
      expire: 10,
    },
  }

  const res = await fetch('https://xumm.app/api/v1/platform/payload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-api-secret': apiSecret,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (!res.ok) {
    return Response.json({ error: data }, { status: res.status })
  }

  return Response.json({
    uuid: data.uuid,
    qr: data.refs?.qr_png,
    signUrl: data.next?.always,
  })
}
