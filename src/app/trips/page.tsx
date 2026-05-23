'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, ChevronRight } from 'lucide-react'
import { useAuthStore, useUIStore, useTripStore } from '@/store'
import { getUserTrips, deleteTrip } from '@/lib/firestore'
import { differenceInDays } from 'date-fns'
import type { Trip, TripStatus } from '@/types'
import toast from 'react-hot-toast'

const TABS: { id: TripStatus | 'all'; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'ongoing', label: '進行中' },
  { id: 'planning', label: '計畫中' },
  { id: 'completed', label: '已完成' },
]

export default function TripsPage() {
  const { user } = useAuthStore()
  const { setLoginModal, setCreateTrip } = useUIStore()
  const { trips, setTrips, removeTrip } = useTripStore()
  const [tab, setTab] = useState<TripStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getUserTrips(user.uid).then(data => {
      // Auto-tag status
      const today = new Date().toISOString().split('T')[0]
      const tagged = data.map(t => ({
        ...t,
        status: t.endDate < today ? 'completed' as TripStatus
               : t.startDate <= today ? 'ongoing' as TripStatus
               : 'planning' as TripStatus,
      }))
      setTrips(tagged)
      setLoading(false)
    })
  }, [user, setTrips])

  const filtered = tab === 'all' ? trips : trips.filter(t => t.status === tab)

  const handleDelete = async (tripId: string) => {
    if (!confirm('確定要刪除此旅程？')) return
    await deleteTrip(tripId)
    removeTrip(tripId)
    toast.success('旅程已刪除')
  }

  if (!user) return (
    <main className="max-w-lg mx-auto bg-white min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4">✈️</div>
      <h2 className="text-2xl font-black mb-2">登入後查看旅程</h2>
      <p className="text-gray-500 text-sm mb-6">儲存行程、管理預算、查看歷史旅遊記錄</p>
      <button onClick={() => setLoginModal(true)} className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold">
        立即登入
      </button>
    </main>
  )

  return (
    <main className="max-w-lg mx-auto bg-white min-h-screen">
      <div className="h-11" />
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl px-5 pb-3 pt-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-black">我的旅程</h1>
          <button onClick={() => setCreateTrip(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white rounded-full text-sm font-bold">
            <Plus className="w-4 h-4" />建立旅程
          </button>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${
                tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🗺️</div>
            <h3 className="text-xl font-black mb-2">還沒有旅程</h3>
            <p className="text-gray-500 text-sm mb-6">開始規劃你的第一次旅行吧</p>
            <button onClick={() => setCreateTrip(true)}
              className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> 建立新旅程
            </button>
          </motion.div>
        )}

        <div className="space-y-3">
          {filtered.map((trip, i) => (
            <TripCard key={trip.tripId} trip={trip} index={i} onDelete={handleDelete} />
          ))}
        </div>
      </div>
    </main>
  )
}

function TripCard({ trip, index, onDelete }: { trip: Trip; index: number; onDelete: (id: string) => void }) {
  const today = new Date().toISOString().split('T')[0]
  const daysLeft = differenceInDays(new Date(trip.endDate), new Date())
  const daysUntil = differenceInDays(new Date(trip.startDate), new Date())

  const STATUS_COLOR = {
    ongoing:   'bg-green-100 text-green-800',
    planning:  'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-600',
  }
  const STATUS_LABEL = { ongoing: '🟢 進行中', planning: '📅 計畫中', completed: '✅ 已完成' }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }}>
      <Link href={`/trips/${trip.tripId}`}>
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="h-24 flex items-center justify-center text-5xl"
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            {trip.countryFlag}
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLOR[trip.status]}`}>
                  {STATUS_LABEL[trip.status]}
                </span>
                <h3 className="font-black text-gray-900 mt-2">{trip.title}</h3>
                <p className="text-xs text-gray-500">{trip.startDate} — {trip.endDate}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 mt-2 flex-shrink-0" />
            </div>
            {trip.status === 'ongoing' && daysLeft >= 0 && (
              <p className="text-xs text-brand-600 font-semibold mt-1">還有 {daysLeft} 天結束</p>
            )}
            {trip.status === 'planning' && daysUntil > 0 && (
              <p className="text-xs text-blue-600 font-semibold mt-1">距離出發還有 {daysUntil} 天</p>
            )}
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">預算 NT${trip.budget.toLocaleString()}</p>
              <button onClick={(e) => { e.preventDefault(); onDelete(trip.tripId) }}
                className="text-xs text-red-400 hover:text-red-600">刪除</button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
