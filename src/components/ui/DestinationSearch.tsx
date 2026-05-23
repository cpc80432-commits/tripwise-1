'use client'
import { useState, useRef, useEffect } from 'react'
import { SEARCH_DATA } from '@/data/destinations'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'

interface DestResult {
  flag: string
  name: string
  country: string
  type: 'country' | 'city'
}

interface Props {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export function DestinationSearch({ value, onChange, placeholder = '搜尋目的地…', className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('tripwise_recent_searches')
    if (saved) setRecentSearches(JSON.parse(saved))
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const results: DestResult[] = query
    ? (() => {
        const q = query.toLowerCase()
        const res: DestResult[] = []
        for (const d of SEARCH_DATA) {
          if (d.country.includes(query)) res.push({ flag: d.flag, name: d.country, country: d.country, type: 'country' })
          for (const city of d.cities) {
            if (city.includes(query) || d.country.toLowerCase().includes(q)) {
              res.push({ flag: d.flag, name: city, country: d.country, type: 'city' })
            }
          }
        }
        return res.slice(0, 8)
      })()
    : []

  const popular = [
    { flag: '🇯🇵', name: '東京', country: '日本' },
    { flag: '🇰🇷', name: '首爾', country: '韓國' },
    { flag: '🇹🇭', name: '曼谷', country: '泰國' },
    { flag: '🇮🇩', name: '峇里島', country: '印尼' },
    { flag: '🇫🇷', name: '巴黎', country: '法國' },
    { flag: '🇸🇬', name: '新加坡', country: '新加坡' },
  ]

  const pick = (name: string) => {
    setQuery(name)
    onChange(name)
    setOpen(false)
    const next = [name, ...recentSearches.filter(r => r !== name)].slice(0, 5)
    setRecentSearches(next)
    localStorage.setItem('tripwise_recent_searches', JSON.stringify(next))
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className="flex items-center gap-3 bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3.5 focus-within:border-brand-500 focus-within:bg-white transition-all cursor-text"
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
      >
        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-gray-900 text-base placeholder:text-gray-400"
        />
        {query && (
          <button onClick={(e) => { e.stopPropagation(); setQuery(''); onChange(''); }}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-80 overflow-y-auto"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: .18 }}
          >
            {!query && recentSearches.length > 0 && (
              <div className="p-4 pb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">最近搜尋</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(r => (
                    <button key={r} onClick={() => pick(r)}
                      className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-brand-50 text-gray-700 rounded-full transition-colors">
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!query && (
              <div className="p-4 pt-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">熱門目的地</p>
                {popular.map(p => (
                  <button key={p.name} onClick={() => pick(p.name)}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-xl transition-colors text-left">
                    <span className="text-2xl">{p.flag}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.country}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query && results.length > 0 && (
              <div className="p-2">
                {results.map((r, i) => (
                  <button key={i} onClick={() => pick(r.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-left">
                    <span className="text-2xl">{r.flag}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.country} · {r.type === 'country' ? '國家' : '城市'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query && results.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <div className="text-3xl mb-2">🔍</div>
                <p>找不到「{query}」的結果</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
