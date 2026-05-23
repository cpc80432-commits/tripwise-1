import type { Timestamp } from 'firebase/firestore'

// ── User ───────────────────────────────────────────────────────────────────
export interface AppUser {
  uid: string
  name: string
  email: string
  avatar: string
  createdAt?: Timestamp
}

// ── Trip ───────────────────────────────────────────────────────────────────
export type TripStatus = 'planning' | 'ongoing' | 'completed'

export interface Trip {
  tripId: string
  userId: string
  title: string
  destination: string
  country: string
  countryFlag: string
  startDate: string        // ISO yyyy-MM-dd
  endDate: string
  budget: number
  currency: string
  travelers: number
  coverImage?: string
  status: TripStatus
  styles?: string[]
  createdAt?: Timestamp
}

// ── Trip Day ───────────────────────────────────────────────────────────────
export interface PlaceItem {
  time: string
  name: string
  type: '景點' | '餐廳' | '購物' | '交通' | '住宿'
  emoji: string
  address?: string
  lat?: number
  lng?: number
  duration?: number        // minutes
  notes?: string
  transitToNext?: string   // e.g. "地鐵 15 分鐘"
}

export interface TripDay {
  day: number
  date: string             // ISO date
  title?: string
  itinerary: PlaceItem[]
  notes?: string
  weather?: WeatherData
}

// ── Expense ────────────────────────────────────────────────────────────────
export type ExpenseCategory = '餐飲' | '住宿' | '交通' | '景點' | '購物' | '其他'

export interface Expense {
  id: string
  tripId: string
  category: ExpenseCategory
  name: string
  amount: number
  currency: string
  date: string
  createdAt?: Timestamp
}

// ── Destination ────────────────────────────────────────────────────────────
export type DestTag = '自然' | '城市' | '文化' | '美食' | '海灘' | '冒險' | '購物' | '浪漫'

export interface Destination {
  id: string
  name: string
  nameEn: string
  country: string
  countryFlag: string
  image: string
  description: string
  tags: DestTag[]
  popularityScore: number
  estimatedBudgetTWD: number
  bestSeason: string
  lat: number
  lng: number
}

// ── Weather ────────────────────────────────────────────────────────────────
export interface WeatherData {
  temp: number
  feelsLike: number
  description: string
  icon: string
  humidity: number
  rainChance: number
  windSpeed: number
}

// ── AI Log ─────────────────────────────────────────────────────────────────
export interface AILog {
  id: string
  userId: string
  prompt: string
  response: string
  createdAt?: Timestamp
}

// ── UI ─────────────────────────────────────────────────────────────────────
export interface NavItem {
  href: string
  label: string
  icon: string
}
