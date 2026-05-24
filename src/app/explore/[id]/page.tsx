'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Heart, Calendar, DollarSign, Globe, Clock, Plus, ChevronRight } from 'lucide-react'
import { DESTINATIONS } from '@/data/destinations'
import { useAuthStore, useUIStore } from '@/store'
import { addFavorite } from '@/lib/firestore'
import toast from 'react-hot-toast'

const DETAIL_DATA: Record<string, any> = {
  tokyo: {
    bestMonths: ['3月', '4月', '5月', '10月', '11月'],
    climate: '四季分明，春季櫻花、秋季楓葉最美，夏季炎熱潮濕',
    currency: '日圓 (JPY)', language: '日語', timezone: 'UTC+9（台灣+1小時）',
    visaInfo: '台灣護照免簽，可停留90天', avgDailyBudget: 3500,
    travelTypes: ['自由行', '美食', '購物', '文化', '動漫', '溫泉'],
    highlights: [
      { emoji: '⛩️', name: '淺草寺', desc: '東京最古老的寺廟，仲見世通商店街必逛', time: '建議2小時' },
      { emoji: '🗼', name: '東京晴空塔', desc: '634公尺高的地標，俯瞰整個東京灣', time: '建議2-3小時' },
      { emoji: '🛍️', name: '銀座購物區', desc: '世界頂級精品雲集，日本購物聖地', time: '建議3-4小時' },
      { emoji: '🍣', name: '築地場外市場', desc: '日本最新鮮的海鮮早餐首選', time: '建議1-2小時' },
      { emoji: '🎮', name: '秋葉原電器街', desc: '動漫、電器、女僕咖啡廳的集散地', time: '建議2-3小時' },
    ],
    notices: [
      { emoji: '📵', title: '電車禮儀', desc: '搭電車時不可大聲講電話，請調靜音模式' },
      { emoji: '🗑️', title: '垃圾桶稀少', desc: '街上幾乎沒有垃圾桶，請自備垃圾袋' },
      { emoji: '💴', title: '現金為王', desc: '部分老店、小吃攤不收信用卡，建議準備現金' },
    ],
  },
  kyoto: {
    bestMonths: ['3月', '4月', '11月'],
    climate: '四季分明，春秋最舒適，夏季炎熱潮濕',
    currency: '日圓 (JPY)', language: '日語', timezone: 'UTC+9（台灣+1小時）',
    visaInfo: '台灣護照免簽，可停留90天', avgDailyBudget: 3000,
    travelTypes: ['文化', '歷史', '自然', '浪漫', '攝影'],
    highlights: [
      { emoji: '⛩️', name: '伏見稻荷大社', desc: '萬本鳥居的震撼景象，日本最具代表性景點', time: '建議2-3小時' },
      { emoji: '🎋', name: '嵐山竹林', desc: '高聳竹林步道，日本最美的自然景觀之一', time: '建議1-2小時' },
      { emoji: '🏯', name: '金閣寺', desc: '金箔覆蓋的三層閣樓，倒映在鏡湖池上', time: '建議1小時' },
    ],
    notices: [
      { emoji: '📸', title: '拍照禮儀', desc: '祇園一帶請勿對藝妓拍照，尊重當地文化' },
      { emoji: '🚌', title: '交通建議', desc: '景點集中，建議購買公車一日券' },
    ],
  },
  osaka: {
    bestMonths: ['3月', '4月', '10月', '11月'],
    climate: '四季分明，比東京稍暖，夏季炎熱',
    currency: '日圓 (JPY)', language: '日語', timezone: 'UTC+9（台灣+1小時）',
    visaInfo: '台灣護照免簽，可停留90天', avgDailyBudget: 2800,
    travelTypes: ['美食', '購物', '親子', '夜生活'],
    highlights: [
      { emoji: '🦑', name: '道頓堀', desc: '大阪最熱鬧的夜生活區，章魚燒一條街', time: '建議3-4小時' },
      { emoji: '🏯', name: '大阪城', desc: '日本三大名城之一，周邊公園春季賞櫻絕美', time: '建議2小時' },
    ],
    notices: [
      { emoji: '💳', title: '交通卡', desc: '建議購買 ICOCA 交通卡，全關西通用' },
    ],
  },
  seoul: {
    bestMonths: ['4月', '5月', '9月', '10月'],
    climate: '四季分明，春秋最佳，冬季寒冷',
    currency: '韓圓 (KRW)', language: '韓語', timezone: 'UTC+9（台灣+1小時）',
    visaInfo: '台灣護照免簽，可停留90天', avgDailyBudget: 2500,
    travelTypes: ['購物', 'K-pop', '美食', '文化', '夜生活'],
    highlights: [
      { emoji: '🏰', name: '景福宮', desc: '朝鮮王朝的王宮，穿著韓服入場免費', time: '建議2小時' },
      { emoji: '🛍️', name: '明洞購物街', desc: '韓國最熱門的購物區，保養品應有盡有', time: '建議3-4小時' },
    ],
    notices: [
      { emoji: '🌶️', title: '飲食注意', desc: '韓國料理普遍較辣，腸胃敏感者要注意' },
      { emoji: '📱', title: 'WiFi 方便', desc: '韓國到處都有免費 WiFi，地鐵也不例外' },
    ],
  },
  bangkok: {
    bestMonths: ['11月', '12月', '1月', '2月'],
    climate: '熱帶氣候，涼季(11-2月)最舒適',
    currency: '泰銖 (THB)', language: '泰語', timezone: 'UTC+7（台灣-1小時）',
    visaInfo: '台灣護照免簽，可停留30天', avgDailyBudget: 1500,
    travelTypes: ['美食', '廟宇', '夜生活', '背包客', '按摩'],
    highlights: [
      { emoji: '🕌', name: '大皇宮', desc: '泰國最重要的歷史建築，金碧輝煌的王宮群', time: '建議3小時' },
      { emoji: '🌃', name: '考山路', desc: '背包客天堂，夜市、酒吧、街頭美食', time: '建議晚上' },
    ],
    notices: [
      { emoji: '👗', title: '寺廟著裝', desc: '進入寺廟必須穿著保守，膝蓋和肩膀需遮蔽' },
      { emoji: '🚕', title: '交通建議', desc: '使用 Grab App 叫車比路邊計程車安全便宜' },
    ],
  },
}

export default function DestinationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { setLoginModal, setCreateTrip } = useUIStore()
  const [liked, setLiked] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'highlights' | 'notices'>('overview')
  const [customDest, setCustomDest] = useState<any>(null)

  const id = params.id as string
  const dest = DESTINATIONS.find(d => d.id === id)

  useEffect(() => {
    if (!dest) {
      const stored = localStorage.getItem("customDestinations"); const aiStored = localStorage.getItem("aiDestinations"); if (aiStored) { const aiDests = JSON.parse(aiStored); if (aiDests[id]) { setCustomDest(aiDests[id]); return; } }
      if (stored) {
        const customs = JSON.parse(stored)
        const found = customs.find((c: any) => c.id === id)
        if (found) setCustomDest(found)
      }
    }
  }, [id, dest])

  const d = dest || customDest
  if (!d) return (
    <div className="flex items-center justify-center min-h-screen flex-col gap-4">
      <p className="text-5xl">🌍</p>
      <p className="text-gray-500">找不到此目的地</p>
      <button onClick={() => router.back()} className="text-blue-500 underline text-sm">返回</button>
    </div>
  )

  const detail = DETAIL_DATA[id] || {
    bestMonths: ['全年'],
    climate: '請查詢當地氣候資訊',
    currency: '當地貨幣', language: '當地語言',
    timezone: '請查詢時差', visaInfo: '請查詢簽證資訊',
    avgDailyBudget: 2000, travelTypes: ['觀光'],
    highlights: [], notices: [],
  }

  const handleLike = async () => {
    if (!user) { setLoginModal(true); return }
    setLiked(!liked)
    if (!liked) {
      await addFavorite(user.uid, { destination: d.name, image: d.image }).catch(() => {})
      toast.success('已收藏 ' + d.name)
    }
  }

  const tabs = [
    { id: 'overview', label: '基本資訊' },
    { id: 'highlights', label: '熱門景點' },
    { id: 'notices', label: '旅遊提醒' },
  ]

  return (
    <main className="max-w-lg mx-auto bg-white min-h-screen pb-24">
      <div className="relative h-72">
        <Image src={d.image} alt={d.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <button onClick={() => router.back()}
          className="absolute top-12 left-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <button onClick={handleLike}
          className="absolute top-12 right-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
          <Heart className={'w-5 h-5 ' + (liked ? 'fill-red-500 stroke-red-500' : 'stroke-white')} />
        </button>
        <div className="absolute bottom-5 left-5 right-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{d.countryFlag}</span>
            <span className="text-white/80 text-sm">{d.country}</span>
          </div>
          <h1 className="text-3xl font-black text-white">{d.name}</h1>
          <p className="text-white/75 text-sm mt-1 line-clamp-2">{d.description}</p>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-gray-100">
        <button onClick={() => user ? setCreateTrip(true) : setLoginModal(true)}
          className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-2xl text-base flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          規劃 {d.name} 行程
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 py-4 border-b border-gray-100">
        <div className="bg-gray-50 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 font-medium">最佳旅遊季節</span>
          </div>
          <p className="text-sm font-bold text-gray-900">{d.bestSeason}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500 font-medium">每日預算</span>
          </div>
          <p className="text-sm font-bold text-gray-900">NT${detail.avgDailyBudget.toLocaleString()}/天</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500 font-medium">語言 / 貨幣</span>
          </div>
          <p className="text-sm font-bold text-gray-900">{detail.language} / {detail.currency}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-500 font-medium">時差</span>
          </div>
          <p className="text-sm font-bold text-gray-900">{detail.timezone}</p>
        </div>
      </div>

      <div className="mx-5 my-4 bg-blue-50 rounded-2xl p-4">
        <p className="text-sm font-bold text-blue-800 mb-1">📋 簽證資訊</p>
        <p className="text-sm text-blue-700">{detail.visaInfo}</p>
      </div>

      <div className="px-5 mb-4">
        <p className="text-sm font-bold text-gray-700 mb-2">📅 最佳旅遊月份</p>
        <div className="flex gap-2 flex-wrap">
          {detail.bestMonths.map((m: string) => (
            <span key={m} className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">{m}</span>
          ))}
        </div>
      </div>

      <div className="px-5 mb-4">
        <p className="text-sm font-bold text-gray-700 mb-2">✨ 適合旅遊類型</p>
        <div className="flex gap-2 flex-wrap">
          {detail.travelTypes.map((t: string) => (
            <span key={t} className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full">{t}</span>
          ))}
        </div>
      </div>

      <div className="px-5">
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-4">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={'flex-1 py-2 rounded-xl text-sm font-bold transition-all ' +
                (activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-gray-50 rounded-2xl p-4 mb-3">
                <p className="text-sm font-bold text-gray-700 mb-2">🌤️ 氣候特色</p>
                <p className="text-sm text-gray-600">{detail.climate}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm font-bold text-gray-700 mb-2">💰 預算概覽</p>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">總預算（5天）</span>
                  <span className="font-bold">NT${d.estimatedBudgetTWD.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">每日平均</span>
                  <span className="font-bold">NT${detail.avgDailyBudget.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'highlights' && (
            <motion.div key="highlights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {detail.highlights.length > 0 ? detail.highlights.map((h: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-4 flex gap-3">
                  <span className="text-2xl">{h.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900 text-sm">{h.name}</p>
                      <span className="text-xs text-gray-400">{h.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{h.desc}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-3xl mb-2">🗺️</p>
                  <p className="text-sm">景點資訊即將更新</p>
                </div>
              )}
            </motion.div>
          )}
          {activeTab === 'notices' && (
            <motion.div key="notices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {detail.notices.length > 0 ? detail.notices.map((n: any, i: number) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                  <span className="text-xl">{n.emoji}</span>
                  <div>
                    <p className="font-bold text-amber-900 text-sm">{n.title}</p>
                    <p className="text-xs text-amber-700 mt-0.5">{n.desc}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="text-sm">暫無特別注意事項</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
