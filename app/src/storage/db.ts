/** Progress records in IndexedDB (SDS 4.2). Nothing leaves the device. */
import Dexie, { type EntityTable } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'

export interface ProgressRecord {
  pageId: string
  completed: boolean
  predictionsCorrect: number
  pointsEarned: number
  formulaUnlocked: boolean
  mistakesFound: number
  updatedAt: string
}

const db = new Dexie('makmalpop') as Dexie & { progress: EntityTable<ProgressRecord, 'pageId'> }
db.version(1).stores({ progress: 'pageId' })

/** Save a finished run, keeping the best score seen for the page. */
export async function saveProgress(rec: Omit<ProgressRecord, 'updatedAt'>): Promise<void> {
  const old = await db.progress.get(rec.pageId)
  await db.progress.put({
    ...rec,
    completed: rec.completed || !!old?.completed,
    pointsEarned: Math.max(rec.pointsEarned, old?.pointsEarned ?? 0),
    formulaUnlocked: rec.formulaUnlocked || !!old?.formulaUnlocked,
    mistakesFound: Math.max(rec.mistakesFound, old?.mistakesFound ?? 0),
    updatedAt: new Date().toISOString(),
  })
}

/** Progress by pageId, live-updating. */
export function useProgress(): Record<string, ProgressRecord> {
  const rows = useLiveQuery(() => db.progress.toArray(), [], [] as ProgressRecord[])
  return Object.fromEntries(rows.map((r) => [r.pageId, r]))
}
