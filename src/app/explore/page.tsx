'use client'
import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { DESTINATIONS } from '@/data/destinations'
import { DestinationSearch } from '@/components/ui/DestinationSearch'
import { useAuthStore, useUIStore } from '@/store'
import { addFavorite } from '@/lib/firestore'
import { Heart } from 'lucide-react'
import type { DestTag } from '@/types'
import toast from 'react-hot-toast'

const FILTER_TAGS: { id: string; label: string; emoji: string }[] = [
  { id: 'all', label: '全部', emoji: '🌏' },
  { id: '自然', label: '自然', emoji: '🌿' },
  { id: '美食', label: '美食', emoji: '🍜' },
  { id: '文化', label: '文化', emoji: '🏛' },
  { id: '海灘', label: '海灘', emoji: '🏖' },
  { id: '城市', label: '城市', emoji: '🌆' },
  { id: '購物', label: '購物', emoji: '🛍' },
]

export default function ExplorePage() {
  const { user } = useAuthStore()
  const { setLoginModal, setCreateTrip } = useUIStore()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [liked, setLiked] = useState<Set<string>>(new Set())

  const filtered = DESTINATIONS.filter(d => {
    const matchTag = filter === 'all' || d.tags.includes(filter as DestTag)
    const matchSearch = !search || d.name.includes(search) || d.nameEn.toLowerCase().includes(search.toLowerCase()) || d.country.includes(search)
    return matchTag && matchSearch
  })

  const toggleLike = async (d: typeof DESTINATIONS[0]) => {
    if (!user) { setLoginModal(true); return }
    const next = new Set(liked)
    if (liked.has(d.id)) {
      next.delete(d.id)
    } else {
      next.add(d.id)
      await addFavorite(user.uid, { destination: d.name, image: d.image }).catch(() => {})
      toast.success(`已收藏 ${d.name} ❤️`)
    }
    setLiked(next)
  }

  return (
    <main className="max-w-lg mx-auto bg-white min-h-screen">
      <div className="h-11" />
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl px-5 pb-3 pt-4 border-b border-gray-100">
        <h1 className="text-2xl font-black mb-3">探索世界</h1>
        <DestinationSearch value={search} onChange={setSearch} />
        <div className="flex gap-2 overflow-x-auto scrollbar-none mt-3 pb-1">
          {FILTER_TAGS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold border-2 transition-all ${
                filter === f.id ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}>
              {f.emoji} {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        {/* Hero card */}
        {filtered[0] && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="relative w-full h-60 rounded-3xl overflow-hidden mb-4 cursor-pointer group">
            <Image src={filtered[0].image} alt={filtered[0].name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute top-3 right-3">
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">🔥 熱門</span>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-2xl font-black text-white mb-1">{filtered[0].name}，{filtered[0].country}</p>
              <p className="text-sm text-white/75 mb-3">★ {filtered[0].popularityScore / 10} · {filtered[0].description.slice(0, 28)}…</p>
              <div className="flex gap-2">
                <button onClick={() => user ? setCreateTrip(true) : setLoginModal(true)}
                  className="bg-white text-gray-900 text-sm font-bold px-4 py-2 rounded-xl">
                  + 加入旅程
                </button>
                <button className="bg-white/20 border border-white/30 text-white text-sm font-bold px-4 py-2 rounded-xl">
                  了解更多
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Card grid */}
        <div className="space-y-4">
          {filtered.slice(1).map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .04 }}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="relative h-44">
                <Image src={d.image} alt={d.name} fill className="object-cover" />
                <button onClick={() => toggleLike(d)}
                  className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
                  <Heart className={`w-4 h-4 ${liked.has(d.id) ? 'fill-red-500 stroke-red-500' : 'stroke-gray-600'}`} />
                </button>
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 backdrop-blur text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {d.countryFlag} {d.tags[0]}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-black text-gray-900">{d.name}，{d.country}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{d.description.slice(0, 40)}…</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-xs font-bold text-amber-500">★ {(d.popularityScore / 10).toFixed(1)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">最佳時節</p>
                    <p className="text-xs text-gray-600">{d.bestSeason}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm text-gray-600">預算約 <span className="font-bold text-gray-900">NT${d.estimatedBudgetTWD.toLocaleString()}</span></p>
                  <button onClick={() => user ? setCreateTrip(true) : setLoginModal(true)}
                    className="text-sm font-bold text-white bg-gray-900 px-4 py-1.5 rounded-xl hover:bg-gray-800 transition-colors">
                    規劃行程
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  )
}
