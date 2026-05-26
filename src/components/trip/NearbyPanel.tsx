'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Loader2, MapPin, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface Recommendation {
  name: string
  type: string
  emoji: string
  address: string
  reason: string
  duration: string
  cost: number
}

interface NearbyPanelProps {
  placeName: string
  placeType: string
  destination: string
  onClose: () => void
  onAdd: (place: Recommendation) => void
}

const typeColor: Record<string, string> = {
  '景點': 'bg-blue-50 text-blue-600',
  '餐廳': 'bg-orange-50 text-orange-600',
  '購物': 'bg-pink-50 text-pink-600',
  '交通': 'bg-gray-50 text-gray-500',
  '住宿': 'bg-purple-50 text-purple-600',
}

export function NearbyPanel({ placeName, placeType, destination, onClose, onAdd }: NearbyPanelProps) {
  const [loading, setLoading] = useState(false)
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [fetched, setFetched] = useState(false)

  async function fetchRecs() {
    if (fetched) return
    setLoading(true)
    try {
      const res = await fetch('/api/nearby-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeName, placeType, destination }),
      })
      const data = await res.json()
      setRecs(data.recommendations || [])
      setFetched(true)
    } catch {
      toast.error('推薦載入失敗')
    }
    setLoading(false)
  }

  // 自動載入
  useState(() => { fetchRecs() })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[75vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* 頂部把手 */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />

        <div className="px-5 pb-8">
          {/* 標題 */}
          <div className="flex items-center justify-between py-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <h3 className="font-bold text-gray-900">附近智能推薦</h3>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">基於「{placeName}」周邊</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* 內容 */}
          {loading ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              <p className="text-sm text-gray-400">AI 分析周邊景點中...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recs.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-gray-50 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <span className="text-2xl shrink-0">{rec.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm">{rec.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${typeColor[rec.type] || 'bg-gray-100 text-gray-500'}`}>
                            {rec.type}
                          </span>
                        </div>
                        <p className="text-xs text-brand-600 mb-1">✨ {rec.reason}</p>
                        {rec.address && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />{rec.address}
                          </p>
                        )}
                        <div className="flex gap-3 mt-1.5">
                          {rec.duration && <span className="text-xs text-gray-400">⏱ {rec.duration}</span>}
                          {rec.cost > 0 && <span className="text-xs text-gray-400">💰 NT${rec.cost}</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => { onAdd(rec); toast.success(`已加入「${rec.name}」`) }}
                      className="shrink-0 w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 active:scale-90 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
