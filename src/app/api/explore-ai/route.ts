import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { query } = await req.json()
    const apiKey = process.env.CLAUDE_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'CLAUDE_API_KEY 未設定' }, { status: 500 })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: '你是專業旅遊顧問。根據使用者查詢推薦3個旅遊目的地。查詢：' + query + '\n\n只回傳JSON，不要其他文字：{"destinations":[{"id":"唯一英文id","name":"城市名稱","nameEn":"City","country":"國家","countryFlag":"🏳️","image":"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80","description":"簡短描述50字內","tags":["標籤1"],"popularityScore":85,"estimatedBudgetTWD":35000,"bestSeason":"最佳季節","aiReason":"針對查詢的推薦原因","lat":0,"lng":0}]}'
        }]
      })
    })

    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: data }, { status: 500 })
    const text = data.content?.[0]?.text
    if (!text) return NextResponse.json({ error: 'No response' }, { status: 500 })
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
