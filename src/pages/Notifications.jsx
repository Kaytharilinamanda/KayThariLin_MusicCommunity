import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import Container from "../components/ui/Container"
import PageHero from "../components/ui/PageHero"
import { api } from "../lib/api"
import { cn, longDate } from "../lib/format"
import { useTitle } from "../lib/useTitle"

const filters = ["All", "Unread"]

export default function Notifications() {
  useTitle("Notifications")
  const [notes, setNotes] = useState([])
  const [ready, setReady] = useState(false)
  const [filter, setFilter] = useState("All")
  const [openId, setOpenId] = useState(null)
  const unread = notes.filter((item) => item.unread).length
  const visible = notes.filter((item) => filter === "All" || item.unread)

  useEffect(() => {
    api("/api/notifications")
      .then((data) => setNotes(data.notifications || []))
      .catch(() => setNotes([]))
      .finally(() => setReady(true))
  }, [])

  async function openNote(item) {
    setOpenId((current) => (current === item.id ? null : item.id))
    if (!item.unread) return
    setNotes((current) => current.map((note) => (note.id === item.id ? { ...note, unread: false } : note)))
    try {
      await api(`/api/notifications/${item.id}`, { method: "PATCH" })
    } catch {
      setNotes((current) => current.map((note) => (note.id === item.id ? { ...note, unread: true } : note)))
    }
  }

  async function readAll() {
    const previous = notes
    setNotes((current) => current.map((note) => ({ ...note, unread: false })))
    try {
      await api("/api/notifications/read", { method: "POST" })
    } catch {
      setNotes(previous)
    }
  }

  return (
    <>
      <PageHero
        compact
        eyebrow="Inbox"
        title="Notifications"
        subtitle="Orders, workshop seats, and course enrollments saved to your account."
        image="/images/notes.jpg"
      />
      <Container className="pt-6 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5" role="tablist" aria-label="Filter notifications">
            {filters.map((option) => {
              const active = filter === option
              const count = option === "Unread" ? unread : notes.length
              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(option)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition duration-200",
                    active ? "bg-[#e11d48] text-[#fff]" : "bg-raised text-[#5c464c] ring-1 ring-[#ead7da] hover:text-[#9f1239]",
                  )}
                >
                  {option}
                  <span className={cn("ml-1.5", active ? "text-[#fff]/80" : "text-zinc-500")}>{count}</span>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={readAll}
            disabled={unread === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-[#9f1239] transition hover:bg-[#fff1f2] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-[#f3d6da] bg-raised">
          {ready && visible.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-zinc-400">{filter === "Unread" ? "No unread notes." : "You're caught up."}</p>
          )}
          {visible.map((item) => {
            const open = openId === item.id
            return (
              <button
                key={item.id}
                type="button"
                aria-expanded={open}
                onClick={() => openNote(item)}
                className="flex w-full items-start gap-3 border-b border-[#f3d6da] px-3 py-2.5 text-left transition duration-200 last:border-b-0 hover:bg-[#fff5f6]"
              >
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", item.unread ? "bg-[#e11d48]" : "bg-[#e7d5d8]")} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={cn("text-sm", item.unread ? "font-semibold text-white" : "font-medium text-zinc-300")}>{item.title}</span>
                    <span className="shrink-0 text-[11px] text-zinc-500">{item.time}</span>
                  </span>
                  {!open && item.detail && <span className="mt-0.5 block truncate text-xs text-zinc-400">{item.detail}</span>}
                  {open && (
                    <span className="mt-1 block text-xs leading-5 text-zinc-400">
                      {[item.detail, item.date ? longDate(item.date) : ""].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </Container>
    </>
  )
}
