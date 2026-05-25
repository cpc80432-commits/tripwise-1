'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Calendar, MapPin, Users, DollarSign,
  Clock, ChevronDown, ChevronUp, Loader2, Pencil,
  Trash2, Cloud, Sun, CloudRain, Wind, Droplets,
} from 'lucide-react'
import { getTrip, getTripDays, deleteTrip } from '@/lib/firestore'
import { useAuthStore, useTripStore } from '@/store'
import type { Trip, TripDay, PlaceItem } from '@/types'
import { ExportPDFButton } from '@/components/trip/ExportPDFButton'

// ── 天氣圖示 ────────────────────────────────────────────────────────────────
function WeatherIcon({ icon, className = 'w-5 h-5' }: { icon: string; className?: string }) {
  if (!icon) return <Cloud className={`${className} text-gray-300`} />
  if (icon.includes('01')) return <Sun className={`${className} text-yellow-400`} />
  if (icon.includes('09') || icon.includes('10')) return <CloudRain className={`${className} text-blue-400`} />
  return <Cloud className={`${className} text-gray-300`} />
}

// ── 狀態標籤 ────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Trip['status'] }) {
  const map: Record<Trip['status'], { label: string; className: string }> = {
    planning:  { label: '規劃中', className: 'bg-blue-100 text-blue-700' },
    ongoing:   { label: '進行中', className: 'bg-emerald-100 text-emerald-700' },
    completed: { label: '已完成', className: 'bg-gray-100 text-gray-500' },
  }
  const { label, className } = map[status] ?? map.planning
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}

// ── 景點類型圖示 ─────────────────────────────────────────────────────────────
const typeColor: Record<PlaceItem['type'], string> = {
  '景點': 'bg-blue-50 text-blue-600',
  '餐廳': 'bg-orange-50 text-orange-600',
  '購物': 'bg-pink-50 text-pink-600',
  '交通': 'bg-gray-50 text-gray-500',
  '住宿': 'bg-purple-50 text-purple-600',
}

// ── 主頁面 ──────────────────────────────────────────────────────────────────
export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const { user } = useAuthStore()
  const { setCurrentTrip, setTripDays } = useTripStore()

  const [trip,     setTrip]     = useState<Trip | null>(null)
  const [days,     setDays]     = useState<TripDay[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [openDay,  setOpenDay]  = useState<number | null>(0)
  const [deleting, setDeleting] = useState(false)
  const [weather, setWeather] = useState<any>(null)

  // 載入資料
  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const [tripData, tripDays] = await Promise.all([
          getTrip(id),
          getTripDays(id),
        ])
        if (!tripData) { setError('找不到此旅程'); return }
        setTrip(tripData)
        setDays(tripDays)
        setCurrentTrip(tripData)
        setTripDays(tripDays)
        // 抓天氣 - 先試原文，失敗再試英文
        const weatherCities = [tripData.destination, tripData.country, 'Tokyo']
        const tryWeather = async (cities: string[]) => {
          for (const city of cities) {
            try {
              const r = await fetch(`/api/weather?city=${encodeURIComponent(city)}`)
              const d = await r.json()
              if (r.ok && d.temp !== undefined) { setWeather(d); return }
            } catch {}
          }
        }
        tryWeather(weatherCities)
      } catch {
        setError('載入失敗，請稍後再試')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  // 刪除旅程
  async function handleDelete() {
    if (!trip || !confirm(`確定刪除「${trip.title}」？此操作無法復原。`)) return
    setDeleting(true)
    try {
      await deleteTrip(trip.tripId)
      router.push('/trips')
    } catch {
      alert('刪除失敗，請稍後再試')
      setDeleting(false)
    }
  }

  // ── 載入中 ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  // ── 錯誤 ──
  if (error || !trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 p-6">
        <p className="text-gray-400 text-lg">{error ?? '未知錯誤'}</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-brand-600 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
      </div>
    )
  }

  const isOwner = user?.uid === trip.userId
  const totalDays = days.length
  const nights    = Math.max(totalDays - 1, 0)

  // 自動估算行程總花費
  const estimatedCost = days.reduce((total, day) => {
    return total + (day.itinerary || []).reduce((dayTotal, place) => {
      if (!place.cost) return dayTotal
      const num = parseInt(place.cost.replace(/[^0-9]/g, ''))
      return dayTotal + (isNaN(num) ? 0 : num)
    }, 0)
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* ── 頂部橫幅 ── */}
      <div className="relative bg-gradient-to-br from-brand-700 via-brand-500 to-brand-400 text-white overflow-hidden">
        {/* 裝飾圓圈 */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-1/2 w-64 h-32 rounded-full bg-white/5" />

        {/* 返回 */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* 操作按鈕 */}
        {isOwner && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={() => router.push(`/trips/${id}/edit`)}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-red-400/60 transition"
            >
              {deleting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* PDF 匯出 */}
        {days && days.length > 0 && (
          <div className="absolute top-4 right-16 z-10">
            <ExportPDFButton trip={trip} days={days} />
          </div>
        )}

        <div className="relative pt-16 pb-8 px-5">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* 國旗 + 狀態 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{trip.countryFlag}</span>
              <StatusBadge status={trip.status} />
            </div>

            <h1 className="text-2xl font-bold leading-snug mb-1">{trip.title}</h1>
            <div className="flex items-center gap-1 text-white/75 text-sm mb-5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{trip.destination}，{trip.country}</span>
            </div>

            {/* 天氣（如果有） */}
            {weather && (
              <div className="mb-4 bg-white/15 rounded-2xl px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-1">
                  <WeatherIcon icon={weather.icon} className="w-8 h-8" />
                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold">{weather.temp}°</span>
                      <span className="text-white/70 text-sm mb-1">C</span>
                    </div>
                    <p className="text-white/80 text-xs capitalize">{weather.description}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-white/60 text-xs">{weather.city}</p>
                    <p className="text-white/60 text-xs mt-0.5">體感 {weather.feelsLike}°C</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 pt-2 border-t border-white/20">
                  <span className="text-xs text-white/70 flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> 濕度 {weather.humidity}%
                  </span>
                  <span className="text-xs text-white/70 flex items-center gap-1">
                    <Wind className="w-3 h-3" /> 風速 {weather.windSpeed} m/s
                  </span>
                </div>
              </div>
            )}

            {/* 資訊卡片 */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { icon: <Calendar className="w-4 h-4" />, label: '出發', value: trip.startDate },
                { icon: <Clock className="w-4 h-4" />,    label: '天數', value: `${totalDays}天${nights}夜` },
                { icon: <Users className="w-4 h-4" />,    label: '人數', value: `${trip.travelers}人` },
              ].map(({ icon, label, value }) => (
                <div key={label} className="bg-white/15 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1 text-white/65 text-xs mb-1">
                    {icon} {label}
                  </div>
                  <p className="text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>

            {/* 預算 */}
            <div className="bg-white/15 rounded-2xl px-4 py-3 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-white/65" />
                <div>
                  <p className="text-xs text-white/65">總預算</p>
                  <p className="text-lg font-bold">
                    {trip.currency} {trip.budget?.toLocaleString() ?? '—'}
                  </p>
                </div>
              </div>
            {/* 估算花費 */}
            {estimatedCost > 0 && (
              <div className="mt-3 bg-white/15 rounded-2xl px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-white/65 mb-1">💰 AI 估算行程花費</p>
                <div className="flex items-end justify-between">
                  <p className="text-lg font-bold">{trip.currency} {estimatedCost.toLocaleString()}</p>
                  <p className={`text-xs font-medium ${estimatedCost > trip.budget ? 'text-red-300' : 'text-emerald-300'}`}>
                    {estimatedCost > trip.budget
                      ? `⚠️ 超出預算 ${(estimatedCost - trip.budget).toLocaleString()}`
                      : `✅ 預算還剩 ${(trip.budget - estimatedCost).toLocaleString()}`}
                  </p>
                </div>
              </div>
            )}

              {trip.styles && trip.styles.length > 0 && (
                <div className="flex gap-1 flex-wrap justify-end max-w-[140px]">
                  {trip.styles.map(s => (
                    <span key={s} className="text-xs bg-white/20 rounded-full px-2 py-0.5">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── 行程時間軸 ── */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-gray-800 mb-3">行程安排</h2>

        {days.length === 0 ? (
          <div className="text-center py-14 text-gray-300">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">尚未建立行程內容</p>
          </div>
        ) : (
          <div className="space-y-3">
            {days.map((day, idx) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                {/* 日期標題（可折疊） */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3.5"
                  onClick={() => setOpenDay(openDay === idx ? null : idx)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {day.day}
                    </span>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-sm">
                        {day.title ? day.title : `第 ${day.day} 天`}
                      </p>
                      {day.date && (
                        <p className="text-xs text-gray-400 mt-0.5">{day.date}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{day.itinerary?.length ?? 0} 個景點</span>
                    {openDay === idx
                      ? <ChevronUp className="w-4 h-4 text-gray-300" />
                      : <ChevronDown className="w-4 h-4 text-gray-300" />}
                  </div>
                </button>

                {/* 景點列表 */}
                <AnimatePresence initial={false}>
                  {openDay === idx && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      <div className="px-4 pb-4 space-y-0">
                        {(!day.itinerary || day.itinerary.length === 0) ? (
                          <p className="text-gray-400 text-sm py-3">尚無景點安排</p>
                        ) : (
                          day.itinerary.map((place, pIdx) => (
                            <div key={pIdx}>
                              <div className="flex gap-3 py-3">
                                {/* 時間軸 */}
                                <div className="flex flex-col items-center">
                                  <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center text-base shrink-0">
                                    {place.emoji}
                                  </div>
                                  {pIdx < day.itinerary.length - 1 && (
                                    <div className="w-px flex-1 bg-brand-100 mt-1" style={{ minHeight: 16 }} />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0 pt-0.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="font-medium text-gray-800 text-sm leading-snug">
                                      {place.name}
                                    </p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${typeColor[place.type]}`}>
                                      {place.type}
                                    </span>
                                  </div>

                                  {place.time && (
                                    <p className="text-xs text-gray-400 mt-0.5">{place.time}
                                      {place.duration ? `・${place.duration}分鐘` : ''}
                                    </p>
                                  )}
                                  {place.address && (
                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 shrink-0" />
                                      {place.address}
                                    </p>
                                  )}
                                  {place.notes && (
                                    <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
                                      {place.notes}
                                    </p>
                                  )}
                                  {place.transitToNext && pIdx < day.itinerary.length - 1 && (
                                    <p className="text-xs text-brand-500 mt-1.5 flex items-center gap-1">
                                      → {place.transitToNext}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {pIdx < day.itinerary.length - 1 && (
                                <div className="h-px bg-gray-50 ml-10" />
                              )}
                            </div>
                          ))
                        )}

                        {/* 備註 */}
                        {day.notes && (
                          <div className="mt-2 bg-amber-50 rounded-xl px-3 py-2 text-xs text-amber-700">
                            📝 {day.notes}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── 底部按鈕 ── */}
      {isOwner && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-10">
          <button
            onClick={() => router.push(`/trips/${id}/edit`)}
            className="w-full py-3.5 rounded-2xl bg-brand-500 text-white font-semibold shadow-lg shadow-brand-500/25 active:scale-95 transition"
          >
            編輯行程
          </button>
        </div>
      )}
    </div>
  )
}
