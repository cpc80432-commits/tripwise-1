'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Plus, Bot, Zap } from 'lucide-react'
import { getTrip, getTripDays, getExpenses } from '@/lib/firestore'
import { getWeather, getWeatherAdvice } from '@/lib/weather'
import { getAISuggestions } from '@/lib/ai'
import { DESTINATIONS } from '@/data/destinations'
import { useTripStore } from '@/store'
import type { Trip, TripDay, Expense, WeatherData } from '@/types'

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { setCurrentTrip, setTripDays: storeDays, setExpenses: storeExpenses } = useTripStore()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [days, setDays] = useState<TripDay[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [activeDay, setActiveDay] = useState(1)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherAdvice, setWeatherAdvice] = useState<string | null>(null)
  const [aiTips, setAiTips] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([getTrip(id), getTripDays(id), getExpenses(id)]).then(([t, d, e]) => {
      if (!t) { router.push('/trips'); return }
      setTrip(t); setCurrentTrip(t)
      setDays(d); storeDays(d)
      setExpenses(e); storeExpenses(e)
      setAiTips(getAISuggestions(t, e))

      // Load weather
      const dest = DESTINATIONS.find(x => x.name === t.destination || x.nameEn === t.destination)
      if (dest) {
        getWeather(dest.lat, dest.lng).then(w => {
          if (w) { setWeather(w); setWeatherAdvice(getWeatherAdvice(w)) }
        })
      }
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <main className="max-w-lg mx-auto bg-white min-h-screen flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-4 animate-spin-slow">✈️</div><p className="text-gray-500">載入中…</p></div>
    </main>
  )

  if (!trip) return null

  const currentDay = days.find(d => d.day === activeDay)
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const budgetPct  = Math.min(Math.round((totalSpent / trip.budget) * 100), 100)

  return (
    <main className="max-w-lg mx-auto bg-white min-h-screen">
      {/* Dark header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white pt-12 pb-5 px-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.back()} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-1.5 bg-brand-500 px-3 py-1.5 rounded-full text-xs font-bold">
            <Zap className="w-3 h-3" /> AI 優化
          </button>
        </div>
        <div className="text-xs font-bold text-brand-400 tracking-widest mb-1">我的旅程</div>
        <h1 className="text-2xl font-black mb-1">{trip.countryFlag} {trip.title}</h1>
        <p className="text-white/50 text-sm">{trip.startDate} — {trip.endDate}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/8 rounded-2xl p-3">
            <p className="text-xl font-black">{days.length}</p>
            <p className="text-xs text-white/50">行程天數</p>
          </div>
          <div className="bg-white/8 rounded-2xl p-3">
            <p className="text-xl font-black text-brand-400">{budgetPct}%</p>
            <p className="text-xs text-white/50">預算使用</p>
          </div>
          <div className="bg-white/8 rounded-2xl p-3">
            <p className="text-xl font-black">{trip.travelers}</p>
            <p className="text-xs text-white/50">旅遊人數</p>
          </div>
        </div>

        {/* Weather advice */}
        {weatherAdvice && (
          <div className="mt-3 bg-white/8 rounded-2xl p-3 flex gap-2 items-start">
            <span className="text-lg">🌧️</span>
            <p className="text-xs text-white/80 leading-relaxed">{weatherAdvice}</p>
          </div>
        )}
      </div>

      {/* AI Tips */}
      {aiTips.length > 0 && (
        <div className="mx-5 mt-4 bg-gray-900 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold text-brand-400">AI 建議</span>
          </div>
          {aiTips.map((tip, i) => (
            <p key={i} className="text-xs text-white/70 leading-relaxed">{tip}</p>
          ))}
        </div>
      )}

      {/* Day selector */}
      <div className="px-5 py-3 flex gap-2 overflow-x-auto scrollbar-none border-b border-gray-100">
        {days.length > 0 ? days.map(d => (
          <button key={d.day} onClick={() => setActiveDay(d.day)}
            className={`flex-shrink-0 w-12 h-14 rounded-xl flex flex-col items-center justify-center text-sm transition-all ${
              activeDay === d.day ? 'bg-brand-500 text-white' : 'bg-gray-50 text-gray-700'
            }`}>
            <span className="text-xs font-semibold opacity-70">第</span>
            <span className="text-lg font-black leading-none">{d.day}</span>
            <span className="text-xs font-semibold opacity-70">天</span>
          </button>
        )) : (
          <p className="text-sm text-gray-400 py-2">尚無行程資料</p>
        )}
      </div>

      {/* Day itinerary */}
      <div className="px-5 py-4">
        {/* Weather for day */}
        {weather && (
          <div className="flex items-center gap-3 bg-blue-50 rounded-2xl p-3 mb-4">
            <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt="" className="w-10 h-10" />
            <div>
              <p className="font-bold text-sm">{weather.temp}°C · {weather.description}</p>
              <p className="text-xs text-gray-500">降雨機率 {weather.rainChance}% · 體感 {weather.feelsLike}°C</p>
            </div>
          </div>
        )}

        {currentDay ? (
          <div>
            {currentDay.itinerary.map((item, i) => (
              <div key={i} className="relative flex gap-3 pb-1">
                {/* Timeline line */}
                {i < currentDay.itinerary.length - 1 && (
                  <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gray-100 z-0" />
                )}
                {/* Dot */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 z-10 border-2 border-white shadow-sm`}
                  style={{ background: item.type === '餐廳' ? '#FEF3C7' : item.type === '景點' ? '#D1FAE5' : '#EDE9FE' }}>
                  {item.emoji}
                </div>
                <div className="flex-1 pb-4">
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">{item.time}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs font-bold text-gray-400">{item.type}</span>
                    </div>
                    <p className="font-bold text-sm text-gray-900">{item.name}</p>
                    {item.address && <p className="text-xs text-gray-400 mt-0.5">📍 {item.address}</p>}
                    {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                    {item.transitToNext && (
                      <div className="flex items-center gap-1.5 mt-2 bg-white rounded-xl px-3 py-1.5">
                        <span className="text-gray-400 text-xs">🚇</span>
                        <span className="text-xs text-gray-500">{item.transitToNext} 到下一站</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-gray-500 text-sm">選擇日期查看行程</p>
          </div>
        )}

        {/* Budget summary */}
        <div className="mt-4 bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-4 text-white">
          <p className="text-xs font-bold text-white/70 mb-2">預算使用</p>
          <div className="flex justify-between mb-2">
            <span className="font-black text-lg">NT${totalSpent.toLocaleString()}</span>
            <span className="text-white/70 text-sm">/ NT${trip.budget.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div className="h-full bg-white rounded-full"
              initial={{ width: 0 }} animate={{ width: `${budgetPct}%` }} transition={{ duration: .8 }} />
          </div>
          <p className="text-xs text-white/70 mt-2">剩餘 NT${(trip.budget - totalSpent).toLocaleString()}</p>
        </div>

        <Link href="/budget" className="block mt-3 text-center text-sm font-bold text-brand-600">
          查看詳細預算 →
        </Link>
      </div>
    </main>
  )
}
