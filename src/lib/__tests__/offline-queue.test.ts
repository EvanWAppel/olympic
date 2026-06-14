import { beforeEach, describe, expect, it, vi } from "vitest"

// In-memory stand-in for IndexedDB — jsdom doesn't implement it.
const store = new Map<string, unknown>()
vi.mock("idb-keyval", () => ({
  get: async (key: string) => store.get(key),
  set: async (key: string, value: unknown) => {
    store.set(key, value)
  },
  del: async (key: string) => {
    store.delete(key)
  },
}))

import {
  enqueueWorkout,
  pendingWorkouts,
  replayQueue,
  registerOnlineReplay,
} from "../offline-queue"

beforeEach(() => {
  store.clear()
})

const workout = (n: number) => ({ speedMph: 3.5, inclinePct: 5, minutes: n })

describe("offline queue", () => {
  it("enqueues workouts and lists them in order", async () => {
    await enqueueWorkout(workout(30))
    await enqueueWorkout(workout(45))
    const pending = await pendingWorkouts()
    expect(pending).toHaveLength(2)
    expect(pending[0].payload).toEqual(workout(30))
    expect(pending[1].payload).toEqual(workout(45))
  })

  it("replays the queue in order and clears it on success", async () => {
    await enqueueWorkout(workout(30))
    await enqueueWorkout(workout(45))
    const posted: unknown[] = []
    const result = await replayQueue(async (payload) => {
      posted.push(payload)
      return true
    })
    expect(result).toEqual({ replayed: 2, remaining: 0 })
    expect(posted).toEqual([workout(30), workout(45)])
    expect(await pendingWorkouts()).toHaveLength(0)
  })

  it("keeps unsent items when a post fails, preserving order", async () => {
    await enqueueWorkout(workout(30))
    await enqueueWorkout(workout(45))
    await enqueueWorkout(workout(60))
    let calls = 0
    const result = await replayQueue(async () => ++calls < 2)
    expect(result).toEqual({ replayed: 1, remaining: 2 })
    const pending = await pendingWorkouts()
    expect(pending.map((p) => p.payload)).toEqual([workout(45), workout(60)])
  })

  it("replays automatically when the browser comes back online", async () => {
    await enqueueWorkout(workout(30))
    const posted: unknown[] = []
    const unregister = registerOnlineReplay(async (payload) => {
      posted.push(payload)
      return true
    })
    window.dispatchEvent(new Event("online"))
    await vi.waitFor(async () => {
      expect(posted).toEqual([workout(30)])
      expect(await pendingWorkouts()).toHaveLength(0)
    })
    unregister()
  })

  it("unregister stops listening for online events", async () => {
    const post = vi.fn(async () => true)
    const unregister = registerOnlineReplay(post)
    unregister()
    await enqueueWorkout(workout(30))
    window.dispatchEvent(new Event("online"))
    await new Promise((r) => setTimeout(r, 10))
    expect(post).not.toHaveBeenCalled()
  })
})
