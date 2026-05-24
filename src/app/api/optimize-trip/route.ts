import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { trip, days } = await req.json()
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
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `你是專業旅遊顧問。分析以下旅程並給出優化建議。

旅程資訊：
目的地：${trip.destination}
日期：${trip.startDate} 至 ${trip.endDate}
預算：NT$${trip.budget}
旅遊人數：${trip.travelers}人
旅遊風格：${(trip.styles || []).join('、')}

請給出3-5條具體的AI優化建議，包含：
1. 行程順序優化
2. 預算分配建議
3. 最佳遊覽時段
4. 必去景點提醒
5. 省錢小技巧

請只回傳JSON：{"tips":["建議1","建議2","建議3"],"summary":"整體評估一句話"}`
        }]
      })
    })

    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: data }, { status: 500 })
    const text = data.content?.[0]?.text
    if (!text) return NextResponse.json({ error: 'No response' }, { status: 500 })
    const clean = text.replace(/```json|```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
