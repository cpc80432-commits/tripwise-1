'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { DESTINATIONS } from '@/data/destinations'
import { useAuthStore, useUIStore } from '@/store'
import { addFavorite } from '@/lib/firestore'
import { Heart, Search, Sparkles, Plus, X, ChevronRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const FILTER_TAGS = [
  { id: 'all', label: '全部', emoji: '🌏' },
  { id: '自然', label: '自然', emoji: '🌿' },
  { id: '美食', label: '美食', emoji: '🍜' },
  { id: '文化', label: '文化', emoji: '🏛' },
  { id: '海灘', label: '海灘', emoji: '🏖' },
  { id: '城市', label: '城市', emoji: '🌆' },
  { id: '購物', label: '購物', emoji: '🛍' },
]

const AI_SUGGESTIONS = [
  '適合6月旅行的海島',
  '預算3萬內去哪好',
  '適合情侶的城市',
  '歐洲冷門秘境',
  '東南亞背包客路線',
]

export default function ExplorePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { setLoginModal, setCreateTrip } = useUIStore()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [aiQuery, setAiQuery] = useState('')
  const [aiResults, setAiResults] = useState<any[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [customDests, setCustomDests] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('customDestinations')
      return s ? JSON.parse(s) : []
    }
    return []
  })
  const [newDest, setNewDest] = useState({
    name: '', country: '', countryFlag: '', image: '',
    description: '', bestSeason: '', estimatedBudgetTWD: 30000, tags: ''
  })

  const allDests = [...DESTINATIONS, ...customDests]
  const filtered = allDests.filter(d => {
    const matchTag = filter === 'all' || d.tags.includes(filter)
    const matchSearch = !search || d.name.includes(search) || d.country.includes(search)
    return matchTag && matchSearch
  })

  const toggleLike = async (d: any) => {
    if (!user) { setLoginModal(true); return }
    const next = new Set(liked)
    if (liked.has(d.id)) {
      next.delete(d.id)
    } else {
      next.add(d.id)
      await addFavorite(user.uid, { destination: d.name, image: d.image }).catch(() => {})
      toast.success('已收藏 ' + d.name + ' 心')
    }
    setLiked(next)
  }

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return
    setAiLoading(true)
    setShowAiPanel(true)
    try {
      const res = await fetch('/api/explore-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery })
      })
      const data = await res.json()
      if (data.destinations) setAiResults(data.destinations)
      else toast.error('AI 搜尋失敗')
    } catch {
      toast.error('AI 搜尋失敗')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAdd = () => {
    if (!newDest.name || !newDest.country) { toast.error('請填寫名稱和國家'); return }
    const c = {
      id: 'custom-' + Date.now(),
      nameEn: newDest.name,
      popularityScore: 80,
      lat: 0, lng: 0,
      isCustom: true,
      ...newDest,
      tags: newDest.tags ? newDest.tags.split(',').map((t: string) => t.trim()) : ['自訂'],
      image: newDest.image || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
      countryFlag: newDest.countryFlag || '🌍',
    }
    const updated = [...customDests, c]
    setCustomDests(updated)
    localStorage.setItem('customDestinations', JSON.stringify(updated))
    setShowAddModal(false)
    setNewDest({ name: '', country: '', countryFlag: '', image: '', description: '', bestSeason: '', estimatedBudgetTWD: 30000, tags: '' })
    toast.success('已新增 ' + c.name)
  }

  return (
    <main className="max-w-lg mx-auto bg-white min-h-screen">
      <div className="h-11" />
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl px-5 pb-3 pt-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-black">探索世界</h1>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-xl">
            <Plus className="w-3.5 h-3.5" />
            新增地點
          </button>
        </div>

        <div className="flex gap-2 mb-2">
          <div className="flex-1 relative">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
            <input
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
              placeholder="AI 推薦：適合6月的海島…"
              className="w-full pl-9 pr-3 py-2.5 bg-purple-50 border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <button onClick={handleAiSearch} disabled={aiLoading}
            className="bg-purple-600 text-white px-4 rounded-xl disabled:opacity-60 flex items-center">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none mb-2 pb-1">
          {AI_SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setAiQuery(s)}
              className="flex-shrink-0 text-xs bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-full">
              {s}
            </button>
          ))}
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜尋城市、國家…"
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none" />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {FILTER_TAGS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold border-2 transition-all ' +
                (filter === f.id ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600')}>
              {f.emoji} {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        <AnimatePresence>
          {showAiPanel && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 bg-purple-50 rounded-3xl p-4 border border-purple-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-black text-purple-900">AI 推薦結果</span>
                </div>
                <button onClick={() => setShowAiPanel(false)}>
                  <X className="w-4 h-4 text-purple-400" />
                </button>
              </div>
              {aiLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                  <span className="ml-2 text-sm text-purple-600">AI 分析中</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiResults.map((d, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => { const ai = JSON.parse(localStorage.getItem('aiDestinations') || '{}'); ai[d.id] = d; localStorage.setItem('aiDestinations', JSON.stringify(ai)); router.push('/explore/' + d.id) }}
                      className="bg-white rounded-2xl overflow-hidden flex cursor-pointer shadow-sm">
                      <div className="relative w-24 h-20 flex-shrink-0">
                        <Image
                          src={d.image || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80'}
                          alt={d.name} fill className="object-cover" />
                      </div>
                      <div className="p-3 flex-1">
                        <p className="font-black text-gray-900 text-sm">{d.countryFlag} {d.name}</p>
                        <p className="text-xs text-purple-600 font-medium mt-0.5">{d.aiReason}</p>
                        <p className="text-xs text-gray-400 mt-1">{d.bestSeason}</p>
                      </div>
                      <div className="flex items-center pr-3">
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {filtered[0] && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push('/explore/' + filtered[0].id)}
            className="relative w-full h-64 rounded-3xl overflow-hidden mb-4 cursor-pointer group">
            <Image src={filtered[0].image} alt={filtered[0].name} fill
              className="object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-3 right-3">
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">熱門</span>
            </div>
            <div className="absolute top-3 left-3">
              <span className="bg-white/20 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/30">
                {filtered[0].countryFlag} {filtered[0].country}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-2xl font-black text-white mb-1">{filtered[0].name}</p>
              <p className="text-sm text-white/75 mb-2 line-clamp-1">{filtered[0].description}</p>
              <div className="flex items-center gap-3">
                <span className="text-white/80 text-xs">{filtered[0].bestSeason}</span>
                <span className="text-white/80 text-xs">NT${filtered[0].estimatedBudgetTWD.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          {filtered.slice(1).map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * .04 }}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="relative h-48 cursor-pointer" onClick={() => router.push('/explore/' + d.id)}>
                <Image src={d.image} alt={d.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <button onClick={e => { e.stopPropagation(); toggleLike(d) }}
                  className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
                  <Heart className={'w-4 h-4 ' + (liked.has(d.id) ? 'fill-red-500 stroke-red-500' : 'stroke-gray-600')} />
                </button>
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 backdrop-blur text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {d.countryFlag} {d.country}
                  </span>
                </div>
              </div>
              <div className="p-4 cursor-pointer" onClick={() => router.push('/explore/' + d.id)}>
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-black text-gray-900 text-base">{d.name}</h3>
                  <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{d.description}</p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-500">{d.bestSeason}</span>
                  <span className="text-xs font-bold text-gray-900 ml-auto">NT${d.estimatedBudgetTWD.toLocaleString()}</span>
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {d.tags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="px-4 pb-4">
                <button onClick={() => user ? setCreateTrip(true) : setLoginModal(true)}
                  className="w-full text-sm font-bold text-white bg-gray-900 py-2.5 rounded-xl">
                  規劃行程
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black">新增旅遊地點</h2>
                <button onClick={() => setShowAddModal(false)}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">城市名稱</label>
                    <input value={newDest.name} onChange={e => setNewDest({...newDest, name: e.target.value})}
                      placeholder="例：布拉格"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">國家</label>
                    <input value={newDest.country} onChange={e => setNewDest({...newDest, country: e.target.value})}
                      placeholder="捷克"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">國旗 Emoji</label>
                    <input value={newDest.countryFlag} onChange={e => setNewDest({...newDest, countryFlag: e.target.value})}
                      placeholder="🇨🇿"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">最佳旅遊季節</label>
                    <input value={newDest.bestSeason} onChange={e => setNewDest({...newDest, bestSeason: e.target.value})}
                      placeholder="5-9月"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">簡短描述</label>
                  <textarea value={newDest.description} onChange={e => setNewDest({...newDest, description: e.target.value})}
                    placeholder="這個地方的特色…" rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">圖片網址</label>
                  <input value={newDest.image} onChange={e => setNewDest({...newDest, image: e.target.value})}
                    placeholder="https://images.unsplash.com/…"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">預算 (TWD)</label>
                    <input type="number" value={newDest.estimatedBudgetTWD}
                      onChange={e => setNewDest({...newDest, estimatedBudgetTWD: Number(e.target.value)})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">標籤（逗號分隔）</label>
                    <input value={newDest.tags} onChange={e => setNewDest({...newDest, tags: e.target.value})}
                      placeholder="文化, 自然"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                  </div>
                </div>
                <button onClick={handleAdd}
                  className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-2xl text-base">
                  新增目的地
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
