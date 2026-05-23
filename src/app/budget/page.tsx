'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useAuthStore, useTripStore, useUIStore } from '@/store'
import { getUserTrips, getExpenses, addExpense, deleteExpense } from '@/lib/firestore'
import { EXPENSE_CATEGORIES } from '@/data/destinations'
import type { Trip, Expense, ExpenseCategory } from '@/types'
import toast from 'react-hot-toast'

export default function BudgetPage() {
  const { user } = useAuthStore()
  const { setLoginModal } = useUIStore()
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ name: '', amount: '', category: '餐飲' as ExpenseCategory })

  useEffect(() => {
    if (!user) return
    getUserTrips(user.uid).then(data => {
      setTrips(data)
      if (data.length > 0) {
        setSelectedTrip(data[0])
        getExpenses(data[0].tripId).then(setExpenses)
      }
    })
  }, [user])

  const selectTrip = async (t: Trip) => {
    setSelectedTrip(t)
    setExpenses(await getExpenses(t.tripId))
  }

  const handleAddExpense = async () => {
    if (!selectedTrip || !user || !form.name || !form.amount) { toast.error('請填寫完整'); return }
    const id = await addExpense(selectedTrip.tripId, {
      tripId: selectedTrip.tripId,
      name: form.name,
      amount: Number(form.amount),
      category: form.category,
      currency: 'TWD',
      date: new Date().toISOString().split('T')[0],
    })
    setExpenses(prev => [{
      id, tripId: selectedTrip.tripId, name: form.name, amount: Number(form.amount),
      category: form.category, currency: 'TWD', date: new Date().toISOString().split('T')[0],
    }, ...prev])
    setForm({ name: '', amount: '', category: '餐飲' })
    setShowAddForm(false)
    toast.success('已新增花費')
  }

  const handleDelete = async (expId: string) => {
    if (!selectedTrip) return
    await deleteExpense(selectedTrip.tripId, expId)
    setExpenses(prev => prev.filter(e => e.id !== expId))
    toast.success('已刪除')
  }

  if (!user) return (
    <main className="max-w-lg mx-auto bg-white min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4">💰</div>
      <h2 className="text-2xl font-black mb-2">登入後管理預算</h2>
      <p className="text-gray-500 text-sm mb-6">追蹤每趟旅行的花費，AI 幫你控管預算</p>
      <button onClick={() => setLoginModal(true)} className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold">立即登入</button>
    </main>
  )

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const budget = selectedTrip?.budget || 0
  const pct = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : 0

  // Category breakdown
  const catBreakdown = EXPENSE_CATEGORIES.map(c => ({
    ...c,
    spent: expenses.filter(e => e.category === c.id).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.spent > 0)

  return (
    <main className="max-w-lg mx-auto bg-white min-h-screen">
      <div className="h-11" />
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black">旅行預算</h1>
          <button onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white rounded-full text-sm font-bold">
            <Plus className="w-4 h-4" />記帳
          </button>
        </div>

        {/* Trip selector */}
        {trips.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none mb-4">
            {trips.map(t => (
              <button key={t.tripId} onClick={() => selectTrip(t)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                  selectedTrip?.tripId === t.tripId ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-700'
                }`}>
                {t.countryFlag} {t.destination}
              </button>
            ))}
          </div>
        )}

        {/* Daily budget card */}
        {selectedTrip && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5 mb-5 text-white"
            style={{ background: 'linear-gradient(135deg, #3A7A62, #4F9B7F)' }}>
            <p className="text-xs font-bold text-white/70 mb-2 tracking-widest">{selectedTrip.title}</p>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-4xl font-black">NT${totalSpent.toLocaleString()}</span>
              <span className="text-sm text-white/70 mb-2">/ NT${budget.toLocaleString()}</span>
            </div>
            <p className="text-sm text-white/70 mb-3">
              {pct < 80 ? `✅ 剩餘 NT${(budget - totalSpent).toLocaleString()}` : `⚠️ 已使用 ${pct}%，請注意控支`}
            </p>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div className={`h-full rounded-full ${pct > 80 ? 'bg-red-400' : 'bg-white'}`}
                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: .8 }} />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div><p className="text-lg font-black">NT${totalSpent.toLocaleString()}</p><p className="text-xs text-white/50">已花費</p></div>
              <div><p className="text-lg font-black">NT${Math.max(0, budget - totalSpent).toLocaleString()}</p><p className="text-xs text-white/50">剩餘</p></div>
              <div><p className="text-lg font-black">{pct}%</p><p className="text-xs text-white/50">使用率</p></div>
            </div>
          </motion.div>
        )}

        {/* Category breakdown */}
        {catBreakdown.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
            <h2 className="font-black text-sm mb-4">費用分類</h2>
            {catBreakdown.map(c => (
              <div key={c.id} className="flex items-center gap-3 mb-3 last:mb-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${c.color}20` }}>{c.emoji}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{c.id}</span>
                    <span className="font-bold">NT${c.spent.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${budget > 0 ? Math.min((c.spent / budget) * 100, 100) : 0}%`, background: c.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent expenses */}
        <h2 className="font-black text-sm mb-3">近期記錄</h2>
        {expenses.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-3xl mb-2">🧾</div>
            <p className="text-sm">還沒有任何記錄</p>
          </div>
        ) : expenses.map((e, i) => {
          const cat = EXPENSE_CATEGORIES.find(c => c.id === e.category)
          return (
            <div key={e.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${cat?.color || '#94A3B8'}20` }}>{cat?.emoji || '📦'}</div>
              <div className="flex-1">
                <p className="font-bold text-sm">{e.name}</p>
                <p className="text-xs text-gray-400">{e.category} · {e.date}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-sm">NT${e.amount.toLocaleString()}</p>
                <button onClick={() => handleDelete(e.id)} className="text-xs text-red-400">刪除</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add expense modal */}
      {showAddForm && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddForm(false)} />
          <motion.div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6"
            initial={{ y: 80 }} animate={{ y: 0 }}>
            <h2 className="text-xl font-black mb-5">新增花費</h2>
            <input type="text" placeholder="消費名稱" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-brand-500 mb-3 text-sm" />
            <input type="number" placeholder="金額 (TWD)" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-brand-500 mb-3 text-sm" />
            <div className="flex flex-wrap gap-2 mb-5">
              {EXPENSE_CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id as ExpenseCategory }))}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-all ${
                    form.category === c.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'
                  }`}>
                  {c.emoji} {c.id}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddForm(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold">取消</button>
              <button onClick={handleAddExpense} className="flex-1 py-3 bg-brand-500 text-white rounded-xl font-bold">新增</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </main>
  )
}
