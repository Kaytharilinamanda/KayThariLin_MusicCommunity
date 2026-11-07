import { useEffect, useState } from "react"
import Container from "../components/ui/Container"
import PageHero from "../components/ui/PageHero"
import { api } from "../lib/api"
import { cachedRows, loadCached, sameRows } from "../lib/catalog"
import { cn, longDate } from "../lib/format"
import { useTitle } from "../lib/useTitle"

export default function Announcements() {
  useTitle("Announcements")
  const [published, setPublished] = useState(() => cachedRows("announcements") || [])
  const [ready, setReady] = useState(() => Boolean(cachedRows("announcements")?.length))
  const [filter, setFilter] = useState("All")
  const [openId, setOpenId] = useState(null)
  const channels = ["All", ...new Set(published.map((item) => item.channel).filter(Boolean))]
  const visible = published.filter((item) => filter === "All" || item.channel === filter)

  useEffect(() => {
    let active = true
    loadCached("announcements", async () => (await api("/api/announcements")).announcements || []).then((rows) => {
      if (!active) return
      setPublished((current) => (sameRows(current, rows) ? current : rows))
      setReady(true)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <PageHero
        compact
        eyebrow="Updates"
        title="Community announcements"
        subtitle="Published notes from the platform. Reading is open. Posting and replies need a user account."
        image="/images/notes.jpg"
      />
      <Container className="pt-6 pb-10">
        <div className="flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Filter announcements">
          {channels.map((option) => {
            const active = filter === option
            const count = option === "All" ? published.length : published.filter((item) => item.channel === option).length
            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(option)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition duration-200",
                  active ? "bg-[#e11d48] text-[#fff]" : "bg-raised text-[#5c464c] ring-1 ring-[#ead7da] hover:text-[#9f1239]",
                )}
              >
                {option}
                <span className={cn("ml-1.5", active ? "text-[#fff]/80" : "text-zinc-500")}>{count}</span>
              </button>
            )
          })}
        </div>

        {!ready && published.length === 0 && <div className="mt-4 h-28 animate-pulse rounded-2xl bg-white/60" />}
        {(ready || published.length > 0) && <div className="mt-4 overflow-hidden rounded-2xl border border-[#f3d6da] bg-raised">
          {ready && visible.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-zinc-400">No announcements in that channel.</p>
          )}
          {visible.map((item) => {
            const open = openId === item.id
            const summary = [item.audience, item.date ? longDate(item.date) : ""].filter(Boolean).join(" · ")
            return (
              <button
                key={item.id}
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
                className="flex w-full items-start gap-3 border-b border-[#f3d6da] px-3 py-2.5 text-left transition duration-200 last:border-b-0 hover:bg-[#fff5f6]"
              >
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", open ? "bg-[#e11d48]" : "bg-[#e7d5d8]")} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-white">{item.title}</span>
                    <span className="shrink-0 text-[11px] text-zinc-500">{item.channel}</span>
                  </span>
                  {!open && summary && <span className="mt-0.5 block truncate text-xs text-zinc-400">{summary}</span>}
                  {open && (
                    <span className="mt-1 block text-xs leading-5 text-zinc-400">
                      {summary}
                      {item.body ? <span className="mt-1 block">{item.body}</span> : null}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>}
      </Container>
    </>
  )
}
