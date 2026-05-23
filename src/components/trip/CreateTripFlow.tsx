'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { X, ChevronLeft } from 'lucide-react'
import { useAuthStore, useUIStore } from '@/store'
import { createTrip } from '@/lib/firestore'
import { generateItinerary } from '@/lib/ai'
import { saveTripDay } from '@/lib/firestore'
import { DestinationSearch } from '@/components/ui/DestinationSearch'
import { TRAVEL_STYLES, DESTINATIONS } from '@/data/destinations'
import { differenceInDays, format, addDays } from 'date-fns'
import toast from 'react-hot-toast'

const TOTAL_STEPS = 5
const STEP_LABELS = ['目的地', '日期', '旅遊風格', '預算', 'AI 生成中']

type FormData = {
  destination: string
  country: string
  countryFlag: string
  startDate: string
  endDate: string
  styles: string[]
  budget: number
  currency: string
  travelers: number
}

export function CreateTripFlow() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { showCreateTrip, setCreateTrip } = useUIStore()
  const [step, setStep] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState(0)
  const [genLabel, setGenLabel] = useState('搜尋最佳路線…')
  const [form, setForm] = useState<FormData>({
    destination: '', country: '', countryFlag: '',
    startDate: '', endDate: '',
    styles: [], budget: 30000, currency: 'TWD', travelers: 1,
  })

  const days = form.startDate && form.endDate
    ? Math.max(1, differenceInDays(new Date(form.endDate), new Date(form.startDate)) + 1)
    : 0

  const close = () => { setCreateTrip(false); setStep(1); setGenerating(false); setGenProgress(0) }

  const next = () => {
    if (step === 1 && !form.destination) { toast.error('請選擇目的地'); return }
    if (step === 2 && (!form.startDate || !form.endDate)) { toast.error('請選擇旅遊日期'); return }
    if (step < TOTAL_STEPS) { setStep(s => s + 1) }
  }
  const back = () => step > 1 ? setStep(s => s - 1) : close()

  const setDays = (n: number) => {
    const start = new Date()
    setForm(f => ({
      ...f,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate:   format(addDays(start, n - 1), 'yyyy-MM-dd'),
    }))
  }

  const toggleStyle = (id: string) => {
    setForm(f => ({
      ...f,
      styles: f.styles.includes(id) ? f.styles.filter(s => s !== id) : [...f.styles, id],
    }))
  }

  const pickDest = (name: string) => {
    const entry = DESTINATIONS.find(d => d.name === name || d.nameEn === name)
    const srcData = require('@/data/destinations').SEARCH_DATA
    let flag = '🌏', country = ''
    for (const s of srcData) {
      if (s.country === name || s.cities.includes(name)) { flag = s.flag; country = s.country; break }
    }
    setForm(f => ({ ...f, destination: name, country: country || name, countryFlag: flag }))
  }

  const runGeneration = async () => {
    if (!user) { toast.error('請先登入'); return }
    setStep(5); setGenerating(true)

    const GEN_STEPS = [
      [20, '搜尋高評價景點…'],
      [45, '最佳化每日動線…'],
      [65, '比對預算方案…'],
      [85, '個人化行程推薦…'],
      [100, '行程規劃完成！'],
    ] as [number, string][]

    for (const [p, lbl] of GEN_STEPS) {
      await new Promise(r => setTimeout(r, 800))
      setGenProgress(p); setGenLabel(lbl)
    }

    try {
      const tripData = {
        userId: user.uid,
        title: `${form.destination} 之旅`,
        destination: form.destination,
        country: form.country,
        countryFlag: form.countryFlag,
        startDate: form.startDate,
        endDate: form.endDate,
        budget: form.budget,
        currency: form.currency,
        travelers: form.travelers,
        styles: form.styles,
        status: 'planning' as const,
      }
      const tripId = await createTrip(tripData)

      // Save generated itinerary
      const itinerary = generateItinerary({ ...tripData, tripId }, days)
      await Promise.all(itinerary.map(d => saveTripDay(tripId, d.day, d)))

      toast.success('行程規劃完成！✨')
      close()
      router.push(`/trips/${tripId}`)
    } catch (e) {
      toast.error('建立失敗，請再試一次')
      setGenerating(false); setStep(4)
    }
  }

  return (
    <AnimatePresence>
      {showCreateTrip && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
          <motion.div
            className="relative w-full max-w-lg bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
            style={{ height: '90vh', maxHeight: 700, display: 'flex', flexDirection: 'column' }}
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <button onClick={back} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-gray-400">{STEP_LABELS[step - 1]}</span>
                <button onClick={close} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-brand-500 rounded-full"
                  animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                  transition={{ duration: .35, ease: 'easeInOut' }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <AnimatePresence mode="wait">
                {/* Step 1: Destination */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <p className="text-xs font-bold text-brand-500 mb-2 tracking-widest">去哪裡？</p>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">選擇旅遊目的地</h2>
                    <p className="text-gray-500 text-sm mb-6">搜尋國家、城市或地區</p>
                    <DestinationSearch value={form.destination} onChange={pickDest} />
                    {form.destination && (
                      <motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 p-4 bg-brand-50 rounded-2xl flex items-center gap-3">
                        <span className="text-3xl">{form.countryFlag}</span>
                        <div>
                          <p className="font-bold text-brand-800">{form.destination}</p>
                          <p className="text-sm text-brand-600">{form.country}</p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Step 2: Dates */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <p className="text-xs font-bold text-brand-500 mb-2 tracking-widest">什麼時候？</p>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">選擇旅遊日期</h2>
                    <p className="text-gray-500 text-sm mb-6">你打算旅行幾天？</p>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">出發日期</label>
                        <input type="date" value={form.startDate} min={format(new Date(), 'yyyy-MM-dd')}
                          onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">返回日期</label>
                        <input type="date" value={form.endDate} min={form.startDate}
                          onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none text-sm" />
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">快速選擇</p>
                    <div className="flex flex-wrap gap-2">
                      {[3, 5, 7, 10, 14].map(n => (
                        <button key={n} onClick={() => setDays(n)}
                          className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                            days === n ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-700 hover:border-brand-300'
                          }`}>
                          {n} 天
                        </button>
                      ))}
                    </div>
                    {days > 0 && (
                      <p className="mt-4 text-sm text-brand-600 font-semibold">已選擇 {days} 天旅程</p>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Styles */}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <p className="text-xs font-bold text-brand-500 mb-2 tracking-widest">旅遊風格</p>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">你喜歡什麼旅行？</h2>
                    <p className="text-gray-500 text-sm mb-6">可多選，AI 將根據偏好規劃行程</p>
                    <div className="grid grid-cols-2 gap-3">
                      {TRAVEL_STYLES.map(s => (
                        <button key={s.id} onClick={() => toggleStyle(s.id)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            form.styles.includes(s.id)
                              ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                          }`}>
                          <div className="text-2xl mb-2">{s.emoji}</div>
                          <div className="font-bold text-gray-900 text-sm">{s.label}</div>
                          <div className="text-xs text-gray-500">{s.desc}</div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Budget */}
                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <p className="text-xs font-bold text-brand-500 mb-2 tracking-widest">旅行預算</p>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">設定旅行預算</h2>
                    <p className="text-gray-500 text-sm mb-8">AI 將在預算內找到最佳方案</p>
                    <div className="text-center mb-6">
                      <div className="text-5xl font-black text-gray-900">NT${form.budget.toLocaleString()}</div>
                      <div className="text-sm text-gray-500 mt-1">總預算</div>
                    </div>
                    <input type="range" min={5000} max={300000} step={5000} value={form.budget}
                      onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))}
                      className="w-full accent-brand-500 mb-6" />
                    <div className="grid grid-cols-3 gap-3">
                      {[[15000, '經濟', '💰'], [45000, '舒適', '✈️'], [90000, '豪華', '💎']].map(([v, l, e]) => (
                        <button key={v} onClick={() => setForm(f => ({ ...f, budget: Number(v) }))}
                          className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${
                            form.budget === Number(v) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700'
                          }`}>
                          <div className="text-xl mb-1">{e}</div>
                          <div>{l}</div>
                          <div className="text-xs text-gray-500 mt-1">NT${Number(v).toLocaleString()}</div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">旅遊人數</label>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setForm(f => ({ ...f, travelers: Math.max(1, f.travelers - 1) }))}
                          className="w-10 h-10 rounded-full border-2 border-gray-200 font-bold text-lg">−</button>
                        <span className="text-xl font-black w-8 text-center">{form.travelers}</span>
                        <button onClick={() => setForm(f => ({ ...f, travelers: Math.min(20, f.travelers + 1) }))}
                          className="w-10 h-10 rounded-full border-2 border-gray-200 font-bold text-lg">+</button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Generating */}
                {step === 5 && (
                  <motion.div key="s5" initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center text-4xl mb-6 shadow-2xl">
                      {genProgress === 100 ? '✈️' : '🤖'}
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">
                      {genProgress === 100 ? '行程規劃完成！' : 'AI 正在規劃你的行程'}
                    </h2>
                    <p className="text-gray-500 text-sm mb-8">{genLabel}</p>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
                      <motion.div className="h-full bg-brand-500 rounded-full" animate={{ width: `${genProgress}%` }} transition={{ duration: .5 }} />
                    </div>
                    <p className="text-xs text-gray-400">{genProgress}%</p>
                    <div className="mt-8 w-full space-y-3 text-left">
                      {[
                        ['gs1', '尋找高評價景點'],
                        ['gs2', '最佳化每日動線'],
                        ['gs3', '比對預算方案'],
                        ['gs4', '個人化行程推薦'],
                      ].map(([id, lbl], i) => (
                        <div key={id} className="flex items-center gap-3"
                          style={{ opacity: genProgress > i * 25 ? 1 : .3 }}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            genProgress > (i + 1) * 25 ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'
                          }`}>{i + 1}</div>
                          <span className="text-sm text-gray-600">{lbl}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer CTA */}
            {step < 5 && (
              <div className="px-6 pb-6 flex-shrink-0">
                <button
                  onClick={step === 4 ? runGeneration : next}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-base hover:bg-gray-800 active:scale-95 transition-all"
                >
                  {step === 4 ? '開始 AI 規劃 🤖' : '繼續'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
