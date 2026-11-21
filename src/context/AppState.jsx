import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { api } from "../lib/api"
import { clearToken, readToken, saveToken } from "../lib/account"
import { clearDesk, writeDesk } from "../lib/deskCache"

const AppStateContext = createContext(null)
const BOOKING_KEY = "harmony-bookings"

function emptyBook() {
  return { tickets: [], workshops: [], courses: [], reviews: [] }
}

function loadBookings() {
  try {
    return JSON.parse(sessionStorage.getItem(BOOKING_KEY) || "{}")
  } catch {
    return {}
  }
}

export function AppStateProvider({ children }) {
  const [user, setUser] = useState(null)
  const [desk, setDesk] = useState(null)
  const [ready, setReady] = useState(false)
  const [bookings, setBookings] = useState(loadBookings)
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const notify = useCallback((message) => {
    setToast(message)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 2800)
  }, [])

  const signOut = useCallback(() => {
    clearToken()
    clearDesk()
    setUser(null)
    setDesk(null)
  }, [])

  const acceptSession = useCallback((data, remember = true) => {
    saveToken(data.token, remember)
    setUser(data.user)
    setDesk(data.desk || null)
    if (data.desk) writeDesk("/api/dashboard", { dashboard: data.desk })
  }, [])

  useEffect(() => {
    if (!readToken()) {
      setReady(true)
      return
    }
    const path = window.location.pathname
    const onDesk = path.startsWith("/admin") || path.startsWith("/organizer")
    api(onDesk ? "/api/me?desk=1" : "/api/me")
      .then((data) => {
        setUser(data.user)
        setDesk(data.desk || null)
        if (data.desk) writeDesk("/api/dashboard", { dashboard: data.desk })
      })
      .catch(() => {
        clearToken()
        setDesk(null)
      })
      .finally(() => setReady(true))
  }, [])

  const addBooking = useCallback(
    (kind, item) => {
      if (!user) return
      setBookings((current) => {
        const mine = current[user.id] || emptyBook()
        const next = { ...current, [user.id]: { ...mine, [kind]: [item, ...(mine[kind] || [])] } }
        sessionStorage.setItem(BOOKING_KEY, JSON.stringify(next))
        return next
      })
    },
    [user],
  )

  const updateBooking = useCallback(
    (kind, id, patch) => {
      if (!user) return
      setBookings((current) => {
        const mine = current[user.id] || emptyBook()
        const next = {
          ...current,
          [user.id]: {
            ...mine,
            [kind]: (mine[kind] || []).map((row) => (row.id === id ? { ...row, ...patch } : row)),
          },
        }
        sessionStorage.setItem(BOOKING_KEY, JSON.stringify(next))
        return next
      })
    },
    [user],
  )

  const myBookings = user ? bookings[user.id] || emptyBook() : emptyBook()

  const value = useMemo(
    () => ({ user, setUser, desk, setDesk, ready, signOut, notify, acceptSession, addBooking, updateBooking, myBookings }),
    [user, desk, ready, signOut, notify, acceptSession, addBooking, updateBooking, myBookings],
  )

  return (
    <AppStateContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] max-w-xs rounded-2xl border border-[#f3d6da] bg-raised px-4 py-3 text-sm text-[#1c1416] shadow-lift">
          {toast}
        </div>
      )}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  return useContext(AppStateContext)
}
