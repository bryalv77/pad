import { get, ref, remove, runTransaction, serverTimestamp, update } from 'firebase/database'
import { db } from '@/lib/firebase'

export type Duration = '1d' | '60d' | 'forever'

export const DURATIONS: { value: Duration; label: string }[] = [
  { value: '1d', label: '1 day' },
  { value: '60d', label: '60 days' },
  { value: 'forever', label: 'Forever' },
]

export interface Pad {
  content: string
  createdAt: number
  updatedAt: number
  /** Epoch ms, or 0 when the pad never expires. */
  expiresAt: number
}

const DAY = 24 * 60 * 60 * 1000
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/

export const normalizeId = (raw: string) =>
  raw.trim().toLowerCase().replace(/\s+/g, '-')

export const isValidId = (id: string) => ID_PATTERN.test(id)

export const isExpired = (pad: Pad) => pad.expiresAt !== 0 && pad.expiresAt <= Date.now()

export const padRef = (id: string) => ref(db, `pads/${id}`)

/** Returns the pad, or null if it doesn't exist or has expired (expired pads are purged). */
export async function getPad(id: string): Promise<Pad | null> {
  const snap = await get(padRef(id))
  if (!snap.exists()) return null
  const pad = snap.val() as Pad
  if (isExpired(pad)) {
    await remove(padRef(id)).catch(() => {})
    return null
  }
  return pad
}

/** Atomically creates a pad. Resolves false if a live pad already uses this id. */
export async function createPad(id: string, duration: Duration): Promise<boolean> {
  const now = Date.now()
  const expiresAt = duration === 'forever' ? 0 : now + (duration === '1d' ? 1 : 60) * DAY
  const result = await runTransaction(padRef(id), (current: Pad | null) => {
    if (current && !isExpired(current)) return // abort
    return { content: '', createdAt: now, updatedAt: now, expiresAt }
  })
  return result.committed
}

export const savePad = (id: string, content: string) =>
  update(padRef(id), { content, updatedAt: serverTimestamp() })
