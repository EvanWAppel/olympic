import { get, set } from "idb-keyval"

const QUEUE_KEY = "olympic-offline-workouts"

export interface QueuedWorkout {
  payload: unknown
  queuedAt: string // ISO timestamp
}

/** Posts one queued payload; returns true when it was accepted. */
export type PostFn = (payload: unknown) => Promise<boolean>

async function readQueue(): Promise<QueuedWorkout[]> {
  return (await get(QUEUE_KEY)) ?? []
}

export async function enqueueWorkout(payload: unknown): Promise<number> {
  const queue = await readQueue()
  queue.push({ payload, queuedAt: new Date().toISOString() })
  await set(QUEUE_KEY, queue)
  return queue.length
}

export async function pendingWorkouts(): Promise<QueuedWorkout[]> {
  return readQueue()
}

/**
 * Posts queued workouts oldest-first. Stops at the first failure so order
 * is preserved; failed and unsent items stay queued for the next replay.
 */
export async function replayQueue(
  post: PostFn,
): Promise<{ replayed: number; remaining: number }> {
  const queue = await readQueue()
  let replayed = 0
  while (replayed < queue.length) {
    let ok: boolean
    try {
      ok = await post(queue[replayed].payload)
    } catch {
      ok = false
    }
    if (!ok) break
    replayed++
  }
  const remaining = queue.slice(replayed)
  await set(QUEUE_KEY, remaining)
  return { replayed, remaining: remaining.length }
}

/**
 * Replays the queue whenever the browser regains connectivity.
 * Returns an unregister function.
 */
export function registerOnlineReplay(
  post: PostFn,
  onReplayed?: (replayed: number) => void,
): () => void {
  const handler = () => {
    void replayQueue(post).then(({ replayed }) => {
      if (replayed > 0) onReplayed?.(replayed)
    })
  }
  window.addEventListener("online", handler)
  return () => window.removeEventListener("online", handler)
}
