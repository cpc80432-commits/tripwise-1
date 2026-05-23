import type { Trip, TripDay, PlaceItem, WeatherData } from '@/types'
import { logAI } from './firestore'

// Default itinerary templates per destination
const TEMPLATES: Record<string, PlaceItem[][]> = {
  tokyo: [
    [
      { time: '08:30', name: '築地場外市場', type: '餐廳', emoji: '🐟', address: '東京都中央區築地4丁目', transitToNext: '地鐵 12 分鐘' },
      { time: '10:30', name: '淺草寺', type: '景點', emoji: '⛩️', address: '東京都台東區淺草2丁目', transitToNext: '步行 3 分鐘' },
      { time: '11:00', name: '仲見世通商店街', type: '購物', emoji: '🏮', address: '淺草仲見世通', transitToNext: '地鐵 20 分鐘' },
      { time: '13:00', name: '午餐 · 一蘭拉麵', type: '餐廳', emoji: '🍜', address: '東京都台東區上野7丁目', transitToNext: '地鐵 15 分鐘' },
      { time: '15:00', name: '東京晴空塔', type: '景點', emoji: '🗼', address: '東京都墨田區押上1丁目', transitToNext: '地鐵 10 分鐘' },
      { time: '18:00', name: '秋葉原電器街', type: '購物', emoji: '🎮', address: '東京都千代田區外神田', transitToNext: '地鐵 8 分鐘' },
      { time: '20:00', name: '晚餐 · 燒肉LIKE', type: '餐廳', emoji: '🥩', address: '秋葉原周邊', transitToNext: undefined },
    ],
    [
      { time: '08:00', name: '早餐 · 全家便利商店', type: '餐廳', emoji: '☕', transitToNext: '地鐵 25 分鐘' },
      { time: '09:30', name: '明治神宮', type: '景點', emoji: '🌿', address: '東京都澀谷區代代木神園町', transitToNext: '步行 10 分鐘' },
      { time: '11:00', name: '原宿竹下通', type: '購物', emoji: '🧁', address: '東京都澀谷區神宮前1丁目', transitToNext: '步行 5 分鐘' },
      { time: '13:00', name: '午餐 · 表參道', type: '餐廳', emoji: '🍱', transitToNext: '步行 15 分鐘' },
      { time: '14:30', name: '涉谷 SCRAMBLE 交叉口', type: '景點', emoji: '🚦', address: '東京都澀谷區道玄坂', transitToNext: '步行 2 分鐘' },
      { time: '16:00', name: '澀谷購物', type: '購物', emoji: '🛍️', transitToNext: '地鐵 12 分鐘' },
      { time: '19:30', name: '晚餐 · 新宿思い出横丁', type: '餐廳', emoji: '🍺', address: '東京都新宿區西新宿', transitToNext: undefined },
    ],
  ],
  kyoto: [
    [
      { time: '08:00', name: '早餐 · 錦市場', type: '餐廳', emoji: '🍢', address: '京都府京都市中京區錦市場', transitToNext: '公車 20 分鐘' },
      { time: '09:30', name: '嵐山竹林', type: '景點', emoji: '🎋', address: '京都府京都市右京區嵯峨天龍寺', transitToNext: '步行 5 分鐘' },
      { time: '10:30', name: '天龍寺', type: '景點', emoji: '⛩️', address: '京都府京都市右京區嵯峨', transitToNext: '步行 10 分鐘' },
      { time: '12:00', name: '渡月橋', type: '景點', emoji: '🌉', address: '嵐山渡月橋', transitToNext: '公車 35 分鐘' },
      { time: '13:30', name: '午餐 · 湯豆腐料理', type: '餐廳', emoji: '🍲', transitToNext: '地鐵 15 分鐘' },
      { time: '15:30', name: '金閣寺', type: '景點', emoji: '🏯', address: '京都府京都市北區金閣寺町', transitToNext: '公車 20 分鐘' },
      { time: '18:00', name: '祇園花見小路', type: '景點', emoji: '🏮', address: '京都府京都市東山區祇園', transitToNext: '步行 10 分鐘' },
      { time: '19:30', name: '晚餐 · 京都料亭', type: '餐廳', emoji: '🍣', transitToNext: undefined },
    ],
  ],
}

function getTemplate(destId: string, dayIndex: number): PlaceItem[] {
  const tmpl = TEMPLATES[destId]
  if (tmpl) return tmpl[dayIndex % tmpl.length]
  // Generic fallback
  return [
    { time: '08:30', name: `${destId} 早餐探索`, type: '餐廳', emoji: '☕', transitToNext: '步行 15 分鐘' },
    { time: '10:00', name: `${destId} 知名景點`, type: '景點', emoji: '🏛️', transitToNext: '計程車 20 分鐘' },
    { time: '13:00', name: '當地特色午餐', type: '餐廳', emoji: '🍽️', transitToNext: '步行 10 分鐘' },
    { time: '15:00', name: '博物館 / 文化景點', type: '景點', emoji: '🎨', transitToNext: '地鐵 15 分鐘' },
    { time: '18:00', name: '夜市 / 購物街', type: '購物', emoji: '🛍️', transitToNext: '步行 5 分鐘' },
    { time: '20:00', name: '當地特色晚餐', type: '餐廳', emoji: '🍜', transitToNext: undefined },
  ]
}

export function generateItinerary(trip: Trip, totalDays: number): TripDay[] {
  const destId = trip.destination.toLowerCase().replace(/\s/g, '')
  const start  = new Date(trip.startDate)
  return Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return {
      day: i + 1,
      date: d.toISOString().split('T')[0],
      itinerary: getTemplate(destId, i),
    }
  })
}

export function optimizeForWeather(days: TripDay[], weatherMap: Record<string, WeatherData>): TripDay[] {
  return days.map(day => {
    const w = weatherMap[day.date]
    if (!w || w.rainChance < 60) return day
    // Move outdoor activities to morning, indoor to afternoon
    const outdoor  = day.itinerary.filter(p => p.type === '景點')
    const indoor   = day.itinerary.filter(p => p.type !== '景點')
    const reordered = [...outdoor.slice(0, 2), ...indoor, ...outdoor.slice(2)]
    return { ...day, itinerary: reordered }
  })
}

export function getAISuggestions(trip: Trip, expenses: { category: string; amount: number }[]): string[] {
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const pct   = Math.round((total / trip.budget) * 100)
  const tips: string[] = []

  if (pct > 80) tips.push(`⚠️ 已使用 ${pct}% 預算，建議控制餐飲與購物支出。`)
  if (pct > 50) tips.push(`💡 已花費 ${total.toLocaleString()} ${trip.currency}，剩餘 ${(trip.budget - total).toLocaleString()}。`)

  const food = expenses.filter(e => e.category === '餐飲').reduce((s, e) => s + e.amount, 0)
  if (food / total > 0.4) tips.push('🍜 餐飲支出佔比偏高，可以考慮嘗試便利商店或市場美食節省費用。')

  return tips
}

export async function logAISuggestion(userId: string, trip: Trip, suggestions: string[]) {
  const prompt   = `生成 ${trip.destination} 旅行建議，預算 ${trip.budget} ${trip.currency}`
  const response = suggestions.join('\n')
  await logAI(userId, prompt, response).catch(() => {})
}
