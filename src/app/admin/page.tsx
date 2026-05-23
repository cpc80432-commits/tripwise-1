'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store'
import { getAllUsers, getAllTrips, getAllAILogs } from '@/lib/firestore'
import { Users, Briefcase, Bot, Search, ChevronDown } from 'lucide-react'

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID

export default function AdminPage() {
  const { user, loading } = useAuthStore()
  const [users, setUsers] = useState<any[]>([])
  const [trips, setTrips] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [tab, setTab] = useState<'users' | 'trips' | 'logs'>('users')
  const [search, setSearch] = useState('')
  const [dataLoading, setDataLoading] = useState(true)

  const isAdmin = user && (user.uid === ADMIN_UID || user.email?.includes('admin'))

  useEffect(() => {
    if (!isAdmin) return
    Promise.all([getAllUsers(), getAllTrips(), getAllAILogs()]).then(([u, t, l]) => {
      setUsers(u); setTrips(t); setLogs(l)
      setDataLoading(false)
    })
  }, [isAdmin])

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-2xl animate-spin-slow">✈️</div></div>

  if (!user || !isAdmin) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
      <div className="text-5xl mb-4">🔒</div>
      <h1 className="text-2xl font-black mb-2">無權限存取</h1>
      <p className="text-gray-500">此頁面僅限管理員使用</p>
    </div>
  )

  const filterUser = users.filter(u => !search || u.email?.includes(search) || u.name?.includes(search))
  const filterTrips = trips.filter(t => !search || t.title?.includes(search) || t.destination?.includes(search))

  const stats = [
    { label: '總使用者', value: users.length, icon: <Users className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700' },
    { label: '總旅程數', value: trips.length, icon: <Briefcase className="w-5 h-5" />, color: 'bg-green-100 text-green-700' },
    { label: 'AI 使用次數', value: logs.length, icon: <Bot className="w-5 h-5" />, color: 'bg-purple-100 text-purple-700' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-black text-gray-900">旅智管理後台</h1>
        <p className="text-sm text-gray-500">登入用戶：{user.email}</p>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
              <div className="text-3xl font-black text-gray-900 mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(['users','trips','logs'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === t ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
              {{ users: '使用者', trips: '旅程', logs: 'AI 紀錄' }[t]}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 mb-4">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜尋…" value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 outline-none text-sm" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {tab === 'users' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['名稱','Email','UID','建立時間'].map(h => <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 text-xs">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filterUser.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{u.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{u.uid?.slice(0, 12)}…</td>
                    <td className="px-4 py-3 text-gray-400">{u.createdAt?.toDate?.()?.toLocaleDateString?.('zh-TW') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'trips' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['標題','目的地','預算','狀態','建立時間'].map(h => <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 text-xs">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filterTrips.map(t => (
                  <tr key={t.tripId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{t.title}</td>
                    <td className="px-4 py-3">{t.countryFlag} {t.destination}</td>
                    <td className="px-4 py-3">NT${t.budget?.toLocaleString()}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{t.status}</span></td>
                    <td className="px-4 py-3 text-gray-400">{t.createdAt?.toDate?.()?.toLocaleDateString?.('zh-TW') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'logs' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['使用者 ID','Prompt','AI 回應','時間'].map(h => <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 text-xs">{h}</th>)}</tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{l.userId?.slice(0, 10)}…</td>
                    <td className="px-4 py-3 max-w-xs truncate text-gray-600">{l.prompt}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-gray-500">{l.response}</td>
                    <td className="px-4 py-3 text-gray-400">{l.createdAt?.toDate?.()?.toLocaleDateString?.('zh-TW') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
