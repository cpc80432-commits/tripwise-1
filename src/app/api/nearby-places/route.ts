import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

export async function POST(req: NextRequest) {
  const { placeName, placeType, destination } = await req.json()

  const prompt = `你是旅遊專家。使用者正在「${destination}」旅遊，目前在「${placeName}」（${placeType}）。
請推薦附近5個值得順路拜訪的地點，涵蓋餐廳、景點、購物等不同類型。
只回傳JSON，格式：{"recommendations":[{"name":"景點名","type":"餐廳","emoji":"🍜","address":"詳細地址","reason":"推薦原因（20字內）","duration":"建議停留時間","cost":200}]}`

  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = (msg.content[0] as any).text
    const json = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json(json)
  } catch (e) {
    console.error('nearby-places error:', e)
    return NextResponse.json({ error: 'AI 推薦失敗' }, { status: 500 })
  }
}
