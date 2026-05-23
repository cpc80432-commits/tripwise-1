import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  setDoc, query, where, orderBy, serverTimestamp, Timestamp, limit,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Trip, TripDay, Expense, Destination, AILog } from '@/types'

// ── Users ──────────────────────────────────────────────────────────────────
export async function createOrUpdateUser(uid: string, data: {
  name: string; email: string; avatar: string
}) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, { uid, ...data, createdAt: serverTimestamp() })
  } else {
    await updateDoc(ref, { name: data.name, avatar: data.avatar })
  }
}

export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export async function getAllUsers() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Trips ──────────────────────────────────────────────────────────────────
export async function createTrip(trip: Omit<Trip, 'tripId' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'trips'), {
    ...trip, createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getTrip(tripId: string) {
  const snap = await getDoc(doc(db, 'trips', tripId))
  return snap.exists() ? { tripId: snap.id, ...snap.data() } as Trip : null
}

export async function getUserTrips(userId: string): Promise<Trip[]> {
  const q = query(collection(db, 'trips'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ tripId: d.id, ...d.data() }) as Trip)
}

export async function updateTrip(tripId: string, data: Partial<Trip>) {
  await updateDoc(doc(db, 'trips', tripId), data)
}

export async function deleteTrip(tripId: string) {
  await deleteDoc(doc(db, 'trips', tripId))
}

export async function getAllTrips(): Promise<Trip[]> {
  const snap = await getDocs(query(collection(db, 'trips'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ tripId: d.id, ...d.data() }) as Trip)
}

// ── Trip Days ──────────────────────────────────────────────────────────────
export async function saveTripDay(tripId: string, day: number, data: Partial<TripDay>) {
  const ref = doc(db, 'trips', tripId, 'trip_days', `day_${day}`)
  await setDoc(ref, { day, ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export async function getTripDays(tripId: string): Promise<TripDay[]> {
  const snap = await getDocs(query(
    collection(db, 'trips', tripId, 'trip_days'), orderBy('day')
  ))
  return snap.docs.map(d => d.data() as TripDay)
}

// ── Expenses ───────────────────────────────────────────────────────────────
export async function addExpense(tripId: string, expense: Omit<Expense, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'trips', tripId, 'expenses'), {
    ...expense, createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getExpenses(tripId: string): Promise<Expense[]> {
  const snap = await getDocs(query(
    collection(db, 'trips', tripId, 'expenses'), orderBy('createdAt', 'desc')
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Expense)
}

export async function deleteExpense(tripId: string, expenseId: string) {
  await deleteDoc(doc(db, 'trips', tripId, 'expenses', expenseId))
}

// ── Favorites ──────────────────────────────────────────────────────────────
export async function addFavorite(userId: string, dest: { destination: string; image: string }) {
  await addDoc(collection(db, 'users', userId, 'favorites'), {
    ...dest, savedAt: serverTimestamp(),
  })
}

export async function getFavorites(userId: string) {
  const snap = await getDocs(
    query(collection(db, 'users', userId, 'favorites'), orderBy('savedAt', 'desc'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── AI Logs ────────────────────────────────────────────────────────────────
export async function logAI(userId: string, prompt: string, response: string) {
  await addDoc(collection(db, 'ai_logs'), {
    userId, prompt, response, createdAt: serverTimestamp(),
  })
}

export async function getAILogs(userId: string): Promise<AILog[]> {
  const q = query(
    collection(db, 'ai_logs'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as AILog)
}

export async function getAllAILogs(): Promise<AILog[]> {
  const snap = await getDocs(query(collection(db, 'ai_logs'), orderBy('createdAt', 'desc'), limit(100)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as AILog)
}
