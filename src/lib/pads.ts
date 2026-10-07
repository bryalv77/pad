import { get, onValue, ref, serverTimestamp, update } from 'firebase/database'
import { db, ensureUser } from '@/lib/firebase'

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
  owner: string
}

export const MAX_CONTENT = 1_000_000
export const MAX_PADS_PER_USER = 20

const DAY = 24 * 60 * 60 * 1000
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{3,38}[a-z0-9]$/

export const normalizeId = (raw: string) => raw.trim().toLowerCase().replace(/\s+/g, '-')

export const isValidId = (id: string) => ID_PATTERN.test(id)

export const isExpired = (pad: Pad) => pad.expiresAt !== 0 && pad.expiresAt <= Date.now()

export const padRef = (id: string) => ref(db, `pads/${id}`)

const isDenied = (e: unknown) => (e as { code?: string })?.code?.includes('permission-denied')

/** Returns the pad, or null if it doesn't exist or has expired (rules hide expired pads). */
export async function getPad(id: string): Promise<Pad | null> {
  await ensureUser()
  try {
    const snap = await get(padRef(id))
    return snap.exists() ? (snap.val() as Pad) : null
  } catch (e) {
    if (isDenied(e)) return null
    throw e
  }
}

/** Clock skew between this device and the database server, in ms (0 if unavailable). */
const serverTimeOffset = () =>
  new Promise<number>((resolve) => {
    const timeout = setTimeout(() => resolve(0), 3000)
    onValue(
      ref(db, '.info/serverTimeOffset'),
      (snap) => {
        clearTimeout(timeout)
        resolve((snap.val() as number | null) ?? 0)
      },
      () => resolve(0),
      { onlyOnce: true },
    )
  })

export type CreateResult = 'created' | 'taken' | 'limit' | 'slow'

/** Atomically creates a pad and bumps the caller's quota. The database rules enforce every limit. */
export async function createPad(id: string, duration: Duration): Promise<CreateResult> {
  const uid = await ensureUser()
  await purgeOwnExpired(uid)
  const count = ((await get(ref(db, `quota/${uid}/count`))).val() as number | null) ?? 0
  if (count >= MAX_PADS_PER_USER) return 'limit'

  const offset = await serverTimeOffset()
  const now = Date.now() + offset
  const expiresAt = duration === 'forever' ? 0 : now + (duration === '1d' ? 1 : 60) * DAY - 60_000
  try {
    await update(ref(db), {
      [`pads/${id}`]: {
        content: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt,
        owner: uid,
      },
      [`quota/${uid}/count`]: count + 1,
      [`quota/${uid}/last`]: serverTimestamp(),
      [`quota/${uid}/pads/${id}`]: expiresAt,
    })
    return 'created'
  } catch (e) {
    if (!isDenied(e)) throw e
    // Denied: either the name is taken by a live pad, or we're creating too fast.
    return (await getPad(id)) ? 'taken' : 'slow'
  }
}

export const savePad = (id: string, content: string) =>
  update(padRef(id), { content, updatedAt: serverTimestamp() })

/** Deletes the caller's expired pads and re-syncs their quota counter (once per tab session). */
async function purgeOwnExpired(uid: string) {
  if (sessionStorage.getItem('pad:purged')) return
  sessionStorage.setItem('pad:purged', '1')
  const mine = ((await get(ref(db, `quota/${uid}/pads`))).val() ?? {}) as Record<string, number>
  const now = Date.now()
  let alive = 0
  let purged = false
  for (const [id, expiresAt] of Object.entries(mine)) {
    if (expiresAt === 0 || expiresAt > now) {
      alive++
      continue
    }
    purged = true
    const index = { [`quota/${uid}/pads/${id}`]: null }
    // If someone else has since reused the name, the pad delete is denied; just drop our index entry.
    await update(ref(db), { ...index, [`pads/${id}`]: null }).catch(() => update(ref(db), index).catch(() => {}))
  }
  if (purged) await update(ref(db), { [`quota/${uid}/count`]: alive }).catch(() => {})
}
