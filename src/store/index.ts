'use client'
import { create } from 'zustand'
import type { AppUser, Trip, TripDay, Expense } from '@/types'

interface AuthStore {
  user: AppUser | null
  loading: boolean
  setUser: (u: AppUser | null) => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))

interface TripStore {
  trips: Trip[]
  currentTrip: Trip | null
  tripDays: TripDay[]
  expenses: Expense[]
  setTrips: (trips: Trip[]) => void
  setCurrentTrip: (t: Trip | null) => void
  setTripDays: (days: TripDay[]) => void
  setExpenses: (ex: Expense[]) => void
  addTrip: (t: Trip) => void
  removeTrip: (id: string) => void
}

export const useTripStore = create<TripStore>((set) => ({
  trips: [],
  currentTrip: null,
  tripDays: [],
  expenses: [],
  setTrips: (trips) => set({ trips }),
  setCurrentTrip: (currentTrip) => set({ currentTrip }),
  setTripDays: (tripDays) => set({ tripDays }),
  setExpenses: (expenses) => set({ expenses }),
  addTrip: (t) => set((s) => ({ trips: [t, ...s.trips] })),
  removeTrip: (id) => set((s) => ({ trips: s.trips.filter(x => x.tripId !== id) })),
}))

interface UIStore {
  showLoginModal: boolean
  showCreateTrip: boolean
  setLoginModal: (v: boolean) => void
  setCreateTrip: (v: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  showLoginModal: false,
  showCreateTrip: false,
  setLoginModal: (showLoginModal) => set({ showLoginModal }),
  setCreateTrip: (showCreateTrip) => set({ showCreateTrip }),
}))
