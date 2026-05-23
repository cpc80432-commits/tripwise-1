'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Briefcase, Compass, DollarSign, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',        label: '首頁',   Icon: Home },
  { href: '/trips',   label: '旅程',   Icon: Briefcase },
  { href: '/explore', label: '探索',   Icon: Compass },
  { href: '/budget',  label: '預算',   Icon: DollarSign },
  { href: '/profile', label: '我的',   Icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-start pt-2 pb-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center gap-1 py-1 transition-all">
              <div className={`w-11 h-7 flex items-center justify-center rounded-2xl transition-all ${active ? 'bg-brand-500/12' : ''}`}>
                <Icon className={`w-5 h-5 transition-all ${active ? 'stroke-brand-500' : 'stroke-gray-400'}`} strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <span className={`text-[10px] font-bold transition-colors ${active ? 'text-brand-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
