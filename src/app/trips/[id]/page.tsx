'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Calendar, MapPin, Users, DollarSign,
  Clock, ChevronDown, ChevronUp, Loader2, Trash2,
  Cloud, Sun, CloudRain, Wind, Droplets, Check, X,
  Sparkles, ChevronRight,
} from 'lucide-react'
import { getTrip, getTripDays, updateTrip, deleteTrip } from '@/lib/firestore'
import { useAuthStore, useTripStore } from '@/store'
import toast from 'react-hot-toast'
import type { Trip, TripDay, PlaceItem } from '@/types'

// ── 天氣圖示 ────────────────────────────────────────────────────────────────
function WeatherIcon({ icon, className = 'w-5 h-5' }: { icon: string; className?: string }) {
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
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}>{label}</span>
}

// ── 景點類型顏色 ─────────────────────────────────────────────────────────────
const typeColor: Record<PlaceItem['type'], string> = {
  '景點': 'bg-blue-50 text-blue-600',
  '餐廳': 'bg-orange-50 text-orange-600',
  '購物': 'bg-pink-50 text-pink-600',
  '交通': 'bg-gray-50 text-gray-500',
  '住宿': 'bg-purple-50 text-purple-600',
}

// ── 可編輯欄位 ───────────────────────────────────────────────────────────────
function EditableField({
  label, icon, value, type = 'text', onSave,
}: {
  label: string
  icon: React.ReactNode
  value: string | number
  type?: string
  onSave: (v: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(String(value))
  const [saving, setSaving]   = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div
      className="bg-white/15 rounded-2xl p-3 backdrop-blur-sm cursor-pointer"
      onClick={() => !editing && setEditing(true)}
    >
      <div className="flex items-center gap-1 text-white/65 text-xs mb-1">
        {icon} {label}
      </div>
      {editing ? (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="flex-1 bg-white/20 text-white text-sm font-semibold rounded-lg px-2 py-1 outline-none min-w-0"
          />
          <button onClick={handleSave} disabled={saving}
            className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          </button>
          <button onClick={() => { setEditing(false); setDraft(String(value)) }}
            className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <p className="text-sm font-semibold text-white">{value} <span className="text-white/40 text-xs">（點擊修改）</span></p>
      )}
    </div>
  )
}

// ── AI 建議面板 ──────────────────────────────────────────────────────────────
function AIPanel({ trip, days }: { trip: Trip; days: TripDay[] }) {
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [tips,     setTips]     = useState<string[]>([])

  async function fetchTips() {
    if (tips.length > 0) { setOpen(o => !o); return }
    setOpen(true)
    setLoading(true)
    try {
      const res = await fetch('/api/optimize-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip, days }),
      })
      const data = await res.json()
      setTips(data.tips ?? ['目前沒有建議，請先建立行程內容。'])
    } catch {
      setTips(['AI 建議暫時無法使用，請稍後再試。'])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-4 mb-4">
      <button
        onClick={fetchTips}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-400 text-white shadow-md shadow-brand-500/20 active:scale-95 transition"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="font-semibold text-sm">AI 智慧行程建議</span>
        </div>
        <ChevronRight className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl shadow-sm mt-2 p-4 space-y-3">
              {loading ? (
                <div className="flex items-center gap-3 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                  <span className="text-sm">AI 分析中...</span>
                </div>
              ) : (
                tips.map((tip, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-brand-500 font-bold text-sm shrink-0">{i + 1}.</span>
                    <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── 主頁面 ──────────────────────────────────────────────────────────────────
export default function TripDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const { user }  = useAuthStore()
  const { setCurrentTrip, setTripDays } = useTripStore()

  const [trip,     setTrip]     = useState<Trip | null>(null)
  const [days,     setDays]     = useState<TripDay[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [openDay,  setOpenDay]  = useState<number | null>(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const [tripData, tripDays] = await Promise.all([getTrip(id), getTripDays(id)])
        if (!tripData) { setError('找不到此旅程'); return }
        setTrip(tripData)
        setDays(tripDays)
        setCurrentTrip(tripData)
        setTripDays(tripDays)
      } catch {
        setError('載入失敗，請稍後再試')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  // 儲存單一欄位
  async function saveField(field: keyof Trip, raw: string) {
    if (!trip) return
    const value = field === 'budget' || field === 'travelers' ? Number(raw) : raw
    const updated = { ...trip, [field]: value } as Trip
    await updateTrip(trip.tripId, { [field]: value })
    setTrip(updated)
    setCurrentTrip(updated)
    toast.success('已儲存')
  }

  async function handleDelete() {
    if (!trip || !confirm(`確定刪除「${trip.title}」？此操作無法復原。`)) return
    setDeleting(true)
    try {
      await deleteTrip(trip.tripId)
      router.push('/trips')
    } catch {
      toast.error('刪除失敗，請稍後再試')
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="max-w-lg mx-auto bg-white min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
    </div>
  )

  if (error || !trip) return (
    <div className="max-w-lg mx-auto bg-white min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <p className="text-gray-400 text-lg">{error ?? '未知錯誤'}</p>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-brand-600 font-medium">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>
    </div>
  )

  const isOwner   = user?.uid === trip.userId
  const totalDays = days.length
  const nights    = Math.max(totalDays - 1, 0)

  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen pb-10">

      {/* ── 頂部橫幅 ── */}
      <div className="relative bg-gradient-to-br from-brand-700 via-brand-500 to-brand-400 text-white overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-1/3 w-64 h-24 rounded-full bg-white/5" />

        {/* 返回 */}
        <button onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/20 backdrop-blur-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* 刪除（擁有者） */}
        {isOwner && (
          <button onClick={handleDelete} disabled={deleting}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-red-400/50 transition">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        )}

        <div className="relative pt-16 pb-8 px-5">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

            {/* 國旗 + 狀態 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{trip.countryFlag}</span>
              <StatusBadge status={trip.status} />
            </div>

            {/* 標題（可編輯） */}
            <div className="mb-1">
              {isOwner ? (
                <EditableField
                  label="" icon={null}
                  value={trip.title}
                  onSave={v => saveField('title', v)}
                />
              ) : (
                <h1 className="text-2xl font-bold">{trip.title}</h1>
              )}
            </div>

            <div className="flex items-center gap-1 text-white/75 text-sm mb-5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{trip.destination}，{trip.country}</span>
            </div>

            {/* 天氣 */}
            {days[0]?.weather && (
              <div className="flex items-center gap-3 mb-4 bg-white/15 rounded-2xl px-4 py-2.5 backdrop-blur-sm w-fit">
                <WeatherIcon icon={days[0].weather.icon} className="w-6 h-6" />
                <span className="text-sm font-medium">
                  {Math.round(days[0].weather.temp)}°C・{days[0].weather.description}
                </span>
                <span className="text-white/60 text-xs flex items-center gap-1">
                  <Droplets className="w-3 h-3" />{days[0].weather.humidity}%
                </span>
                <span className="text-white/60 text-xs flex items-center gap-1">
                  <Wind className="w-3 h-3" />{days[0].weather.windSpeed}m/s
                </span>
              </div>
            )}

            {/* 可編輯資訊卡片 */}
            {isOwner ? (
              <>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <EditableField
                    label="出發日" icon={<Calendar className="w-3 h-3" />}
                    value={trip.startDate} type="date"
                    onSave={v => saveField('startDate', v)}
                  />
                  <div className="bg-white/15 rounded-2xl p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-1 text-white/65 text-xs mb-1">
                      <Clock className="w-3 h-3" /> 天數
                    </div>
                    <p className="text-sm font-semibold">{totalDays}天{nights}夜</p>
                  </div>
                  <EditableField
                    label="人數" icon={<Users className="w-3 h-3" />}
                    value={trip.travelers} type="number"
                    onSave={v => saveField('travelers', v)}
                  />
                </div>
                <EditableField
                  label="總預算" icon={<DollarSign className="w-4 h-4" />}
                  value={`${trip.currency} ${trip.budget}`} type="text"
                  onSave={v => {
                    const num = v.replace(/[^0-9]/g, '')
                    return saveField('budget', num)
                  }}
                />
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    { icon: <Calendar className="w-3 h-3" />, label: '出發', value: trip.startDate },
                    { icon: <Clock className="w-3 h-3" />,    label: '天數', value: `${totalDays}天${nights}夜` },
                    { icon: <Users className="w-3 h-3" />,    label: '人數', value: `${trip.travelers}人` },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="bg-white/15 rounded-2xl p-3 backdrop-blur-sm">
                      <div className="flex items-center gap-1 text-white/65 text-xs mb-1">{icon} {label}</div>
                      <p className="text-sm font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white/15 rounded-2xl px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs text-white/65">總預算</p>
                  <p className="text-lg font-bold">{trip.currency} {trip.budget?.toLocaleString()}</p>
                </div>
              </>
            )}

            {/* 風格標籤 */}
            {trip.styles && trip.styles.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-3">
                {trip.styles.map(s => (
                  <span key={s} className="text-xs bg-white/20 rounded-full px-2.5 py-0.5">{s}</span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── AI 智慧建議 ── */}
      <div className="mt-5">
        <AIPanel trip={trip} days={days} />
      </div>

      {/* ── 行程時間軸 ── */}
      <div className="px-4 mt-2">
        <h2 className="text-base font-bold text-gray-800 mb-3">行程安排</h2>

        {days.length === 0 ? (
          <div className="text-center py-14 text-gray-300">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">尚未建立行程內容</p>
          </div>
        ) : (
          <div className="space-y-3">
            {days.map((day, idx) => (
              <motion.div key={day.day}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-50"
              >
                {/* 日期標題 */}
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
                        {day.title ?? `第 ${day.day} 天`}
                      </p>
                      {day.date && <p className="text-xs text-gray-400 mt-0.5">{day.date}</p>}
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
                    <motion.div key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      <div className="px-4 pb-4">
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
                                    <p className="font-medium text-gray-800 text-sm leading-snug">{place.name}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${typeColor[place.type]}`}>
                                      {place.type}
                                    </span>
                                  </div>
                                  {place.time && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {place.time}{place.duration ? `・${place.duration}分鐘` : ''}
                                    </p>
                                  )}
                                  {place.address && (
                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 shrink-0" />{place.address}
                                    </p>
                                  )}
                                  {place.notes && (
                                    <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
                                      {place.notes}
                                    </p>
                                  )}
                                  {place.transitToNext && pIdx < day.itinerary.length - 1 && (
                                    <p className="text-xs text-brand-500 mt-1.5">→ {place.transitToNext}</p>
                                  )}
                                </div>
                              </div>
                              {pIdx < day.itinerary.length - 1 && (
                                <div className="h-px bg-gray-50 ml-10" />
                              )}
                            </div>
                          ))
                        )}
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
    </div>
  )
}
