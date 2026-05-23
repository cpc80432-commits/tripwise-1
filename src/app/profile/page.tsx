'use client'
import Image from 'next/image'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore, useUIStore } from '@/store'
import { motion } from 'framer-motion'
import { ChevronRight, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user } = useAuthStore()
  const { setLoginModal } = useUIStore()

  const handleSignOut = async () => {
    await signOut(auth)
    toast.success('已登出')
  }

  if (!user) return (
    <main className="max-w-lg mx-auto bg-white min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4">🧭</div>
      <h2 className="text-2xl font-black mb-2">登入你的帳號</h2>
      <p className="text-gray-500 text-sm mb-6">管理旅程、偏好設定與 AI 使用紀錄</p>
      <button onClick={() => setLoginModal(true)} className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold">立即登入</button>
    </main>
  )

  return (
    <main className="max-w-lg mx-auto bg-white min-h-screen">
      <div className="h-11" />
      <div className="px-5 py-4">
        <h1 className="text-2xl font-black mb-5">我的帳戶</h1>

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-3xl p-5 text-center mb-5">
          {user.avatar
            ? <Image src={user.avatar} alt="" width={80} height={80} className="rounded-full mx-auto mb-3 ring-4 ring-brand-100" />
            : <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center text-white text-3xl font-black mx-auto mb-3">{user.name[0]}</div>
          }
          <h2 className="text-xl font-black text-gray-900">{user.name}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
        </motion.div>

        {/* Settings list */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm mb-4">
          {[
            { icon: '✈️', label: '我的旅程', href: '/trips', color: '#D1FAE5' },
            { icon: '❤️', label: '收藏景點', href: '/explore', color: '#FEE2E2' },
            { icon: '🤖', label: 'AI 偏好設定', href: '#', color: '#EDE9FE' },
            { icon: '⚙️', label: '帳戶設定', href: '#', color: '#F1F5F9' },
          ].map((item, i, arr) => (
            <div key={item.label}>
              <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: item.color }}>
                  {item.icon}
                </div>
                <span className="flex-1 font-semibold text-sm">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              {i < arr.length - 1 && <div className="h-px bg-gray-100 ml-16" />}
            </div>
          ))}
        </div>

        <button onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-red-100 text-red-500 rounded-2xl font-bold hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" /> 登出帳號
        </button>
      </div>
    </main>
  )
}
