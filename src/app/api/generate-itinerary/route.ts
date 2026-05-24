import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { destination, days, budget, currency, travelers } = await req.json()
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
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `你是專業旅遊規劃師，請為以下旅程生成詳細行程。目的地：${destination}，天數：${days}天，預算：${budget} ${currency}，人數：${travelers}人。請只回傳JSON格式，不要其他文字：{"days":[{"day":1,"date":"","itinerary":[{"time":"09:00","name":"景點名稱","type":"景點","emoji":"🏛️","address":"地址","transitToNext":"交通方式10分鐘"}]}]}。每天安排5-7個地點，包含餐廳、景點、購物，使用繁體中文。`
        }]
      })
    })

    const data = await response.json()
    console.log('Claude response:', JSON.stringify(data))
    
    if (!response.ok) return NextResponse.json({ error: data }, { status: 500 })
    
    const text = data.content?.[0]?.text
    if (!text) return NextResponse.json({ error: 'No text in response', data }, { status: 500 })
    
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    const resultDays = parsed.days ?? parsed
    return NextResponse.json({ days: resultDays })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
