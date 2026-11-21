import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "./api"

const memory = new Map()
const pending = new Map()
const generation = new Map()

export function clearDesk() {
  memory.clear()
  pending.clear()
  generation.clear()
}

export function readDesk(path) {
  return memory.has(path) ? memory.get(path) : null
}

export function writeDesk(path, value) {
  memory.set(path, value)
  return value
}

export function fetchDesk(path, { fresh = false } = {}) {
  if (fresh) generation.set(path, (generation.get(path) || 0) + 1)
  else if (pending.has(path)) return pending.get(path)
  const stamp = generation.get(path) || 0
  const task = api(path)
    .then((data) => {
      if ((generation.get(path) || 0) === stamp) {
        memory.set(path, data)
        pending.delete(path)
      }
      return data
    })
    .catch((error) => {
      if ((generation.get(path) || 0) === stamp) pending.delete(path)
      throw error
    })
  pending.set(path, task)
  return task
}

export function warmDesk(paths) {
  let stop = false
  const timer = window.setTimeout(async () => {
    for (const path of paths) {
      if (stop) return
      try {
        await fetchDesk(path)
      } catch {
        // The page that needs this list will show its own error.
      }
    }
  }, 250)
  return () => {
    stop = true
    window.clearTimeout(timer)
  }
}

export function useDeskRows(path, listKey) {
  const cached = path ? readDesk(path) : null
  const [rows, setRowsState] = useState(() => (cached ? cached[listKey] || [] : []))
  const [ready, setReady] = useState(Boolean(cached))
  const request = useRef(0)

  useEffect(() => {
    if (!path) return undefined
    const stored = readDesk(path)
    if (stored) {
      setRowsState(stored[listKey] || [])
      setReady(true)
    }
    const id = ++request.current
    fetchDesk(path)
      .then((data) => {
        if (request.current !== id) return
        setRowsState(data[listKey] || [])
        setReady(true)
      })
      .catch(() => {
        if (request.current === id) setReady(true)
      })
    return () => {
      request.current += 1
    }
  }, [path, listKey])

  const setRows = useCallback(
    (value) => {
      setRowsState((current) => {
        const next = typeof value === "function" ? value(current) : value
        if (path) {
          const stored = readDesk(path) || {}
          writeDesk(path, { ...stored, [listKey]: next })
        }
        return next
      })
    },
    [path, listKey],
  )

  const reload = useCallback(() => {
    if (!path) return Promise.resolve([])
    const id = ++request.current
    return fetchDesk(path, { fresh: true }).then((data) => {
      const next = data[listKey] || []
      if (request.current === id) {
        setRowsState(next)
        setReady(true)
      }
      return next
    })
  }, [path, listKey])

  return { rows, setRows, ready, reload }
}
