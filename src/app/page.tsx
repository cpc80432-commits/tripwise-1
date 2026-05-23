'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserTrips } from '@/lib/firestore'
import { useAuthStore, useUIStore } from '@/store'
import { useTripStore } from '@/store'
import { DESTINATIONS } from '@/data/destinations'
import { differenceInDays } from 'date-fns'
import type { Trip } from '@/types'

export default function HomePage() {
  const { user, loading } = useAuthStore()
  const { setLoginModal, setCreateTrip } = useUIStore()
  const { trips, setTrips } = useTripStore()
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)

  useEffect(() => {
    if (!user) return
    getUserTrips(user.uid).then(data => {
      setTrips(data)
      const today = new Date().toISOString().split('T')[0]
      const ongoing = data.find(t => t.startDate <= today && t.endDate >= today)
      if (ongoing) setActiveTrip(ongoing)
    })
  }, [user, setTrips])

  const upcomingTrips = trips.filter(t => t.startDate > new Date().toISOString().split('T')[0]).slice(0, 2)

  return (
    <main className="max-w-lg mx-auto bg-white min-h-screen">
      {/* Status bar */}
      <div className="h-11" />

      <div className="px-5 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">早安 ☀️</p>
            <h1 className="text-2xl font-black text-gray-900">
              {user ? `嗨，${user.name.split(' ')[0]}` : '開始規劃旅程'}
            </h1>
          </div>
          {user ? (
            <div className="relative group">
              {user.avatar
                ? <Image src={user.avatar} alt="" width={44} height={44} className="rounded-full ring-2 ring-brand-200 cursor-pointer" />
                : <div className="w-11 h-11 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-lg cursor-pointer">{user.name[0]}</div>
              }
            </div>
          ) : (
            <button onClick={() => setLoginModal(true)}
              className="px-4 py-2 bg-brand-500 text-white rounded-full text-sm font-bold">
              登入
            </button>
          )}
        </div>

        {/* Active Trip Card */}
        {activeTrip && (
          <Link href={`/trips/${activeTrip.tripId}`}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-5 mb-5 text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0D1117, #1a2744 60%, #0f3d2e)' }}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/15 rounded-full -translate-y-10 translate-x-10 blur-2xl" />
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-dot" />
                <span className="text-xs font-bold text-brand-400 tracking-widest">進行中的旅程</span>
              </div>
              <div className="text-xl font-black mb-1">{activeTrip.countryFlag} {activeTrip.title}</div>
              <div className="text-sm text-white/60 mb-4">{activeTrip.startDate} — {activeTrip.endDate}</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  [differenceInDays(new Date(activeTrip.endDate), new Date()), '剩餘天數'],
                  [trips.length, '我的旅程'],
                  ['查看 →', '行程詳情'],
                ].map(([v, l], i) => (
                  <div key={i}>
                    <div className="text-lg font-black text-white">{v}</div>
                    <div className="text-xs text-white/50">{l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </Link>
        )}

        {/* AI Assistant */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}
          className="rounded-2xl p-4 mb-5 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0D1117, #1a2744)' }}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-brand-500/15 rounded-full blur-xl" />
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-xl flex-shrink-0">🤖</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-dot" />
                <span className="text-xs font-bold text-brand-400 tracking-wider">AI 助理</span>
              </div>
              <p className="text-sm font-semibold text-white mb-1">想規劃一趟完美旅程？</p>
              <p className="text-xs text-white/60">AI 將幫你安排行程、控制預算、推薦美食景點。</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => user ? setCreateTrip(true) : setLoginModal(true)}
              className="flex-1 py-2.5 bg-brand-500 rounded-xl text-sm font-bold text-white">
              開始規劃
            </button>
            <Link href="/explore" className="flex-1 py-2.5 text-center text-sm font-bold text-white/70 border border-white/20 rounded-xl">
              探索目的地
            </Link>
          </div>
        </motion.div>

        {/* Popular Destinations */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black">熱門目的地</h2>
            <Link href="/explore" className="text-sm font-bold text-brand-500">查看全部</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 -mx-5 px-5">
            {DESTINATIONS.slice(0, 6).map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }}>
                <Link href={`/explore?dest=${d.id}`} className="flex-shrink-0 w-36">
                  <div className="relative w-36 h-48 rounded-2xl overflow-hidden">
                    <Image src={d.image} alt={d.name} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white font-bold text-sm">{d.name}</p>
                      <p className="text-white/70 text-xs">{d.countryFlag} {d.country}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <h2 className="text-lg font-black mb-3">快速入口</h2>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { icon: '✈️', label: '建立新旅程', desc: 'AI 智能規劃', action: () => user ? setCreateTrip(true) : setLoginModal(true) },
            { icon: '🔍', label: '探索目的地', desc: '尋找旅遊靈感', href: '/explore' },
            { icon: '📅', label: '我的旅程', desc: '查看所有行程', href: '/trips' },
            { icon: '💰', label: '旅行預算', desc: '追蹤旅行花費', href: '/budget' },
          ].map((item, i) => (
            item.href
              ? <Link key={i} href={item.href} className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-bold text-sm text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </Link>
              : <button key={i} onClick={item.action} className="bg-gray-50 rounded-2xl p-4 text-left hover:bg-gray-100 transition-colors w-full">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-bold text-sm text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </button>
          ))}
        </div>

        {/* Upcoming trips */}
        {upcomingTrips.length > 0 && (
          <div>
            <h2 className="text-lg font-black mb-3">即將出發</h2>
            {upcomingTrips.map(t => (
              <Link key={t.tripId} href={`/trips/${t.tripId}`}>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl mb-2 hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-xl">{t.countryFlag}</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{t.title}</p>
                    <p className="text-xs text-gray-500">{t.startDate} 出發 · {differenceInDays(new Date(t.startDate), new Date())} 天後</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
