import { useEffect, useRef, useState } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { ArrowUpRight, Bell, ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, UserRound, X } from "lucide-react"
import Logo from "./Logo"
import ThemeToggle from "../ui/ThemeToggle"
import { useAppState } from "../../context/AppState"
import { cn } from "../../lib/format"

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "H"
  return `${parts[0][0]}${parts[1]?.[0] || ""}`.toUpperCase()
}

function NavGroups({ groups, collapsed = false, onNavigate }) {
  return (
    <div className={cn("space-y-5", collapsed && "space-y-3")}>
      {groups.map((group, index) => (
        <div key={group.label}>
          {collapsed ? (
            index > 0 && <div className="mx-auto mb-3 h-px w-6 bg-white/10" />
          ) : (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{group.label}</p>
          )}
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center rounded-2xl text-sm transition duration-200",
                      collapsed ? "justify-center px-1 py-1" : "gap-3 px-2 py-1.5",
                      isActive ? "bg-white/[0.07] text-white" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-xl transition duration-200",
                          isActive
                            ? "bg-gradient-to-br from-violet-400 to-purple-700 text-white shadow-glow"
                            : "bg-white/[0.04] text-[#e7a4a8] group-hover:scale-105 group-hover:bg-white/10 group-hover:text-white",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      {!collapsed && <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>}
                      {isActive && !collapsed && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function StudioShell({ homeTo, kicker, groups, profileTo, role, notes = [], notice = null }) {
  const [menu, setMenu] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [panel, setPanel] = useState("")
  const [seen, setSeen] = useState(false)
  const [query, setQuery] = useState("")
  const { pathname } = useLocation()
  const [path, setPath] = useState(pathname)
  const navigate = useNavigate()
  const headerRef = useRef(null)
  const searchRef = useRef(null)
  const { user, signOut } = useAppState()

  if (path !== pathname) {
    setPath(pathname)
    setMenu(false)
    setPanel("")
    setQuery("")
  }

  const flat = groups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
  const current = flat
    .filter((item) => (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)))
    .sort((a, b) => b.to.length - a.to.length)[0]
  const needle = query.trim().toLowerCase()
  const results = needle ? flat.filter((item) => item.label.toLowerCase().includes(needle)).slice(0, 6) : []
  const detail = role === "Organizer" && user?.organization ? user.organization : role

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [menu])

  useEffect(() => {
    function onPointer(event) {
      if (!headerRef.current?.contains(event.target)) {
        setPanel("")
        setQuery("")
      }
    }
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key === "Escape") {
        setPanel("")
        setQuery("")
        setMenu(false)
      }
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  function openPanel(next) {
    setQuery("")
    setPanel((value) => (value === next ? "" : next))
    if (next === "notes") setSeen(true)
  }

  return (
    <div className="min-h-svh bg-ink text-zinc-100 lg:flex">
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-white/10 bg-ink-soft py-5 transition-[width] duration-300 ease-out lg:flex",
          collapsed ? "w-[88px] px-3" : "w-[272px] px-4",
        )}
      >
        <div className={cn("flex items-center", collapsed ? "flex-col gap-3" : "justify-between gap-2")}>
          <Logo to={homeTo} compact={collapsed} />
          <button
            type="button"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            onClick={() => setCollapsed((value) => !value)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        {!collapsed && <p className="mt-3 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">{kicker}</p>}
        <div className="mt-5 flex-1 overflow-y-auto pr-1">
          <NavGroups groups={groups} collapsed={collapsed} />
        </div>
        <Link
          to="/"
          title={collapsed ? "Public site" : undefined}
          className={cn(
            "mt-4 flex items-center rounded-2xl text-sm text-zinc-400 transition hover:bg-white/[0.05] hover:text-white",
            collapsed ? "justify-center px-1 py-2" : "gap-2 px-3 py-2.5",
          )}
        >
          <ArrowUpRight className="h-4 w-4 shrink-0 text-[#e7a4a8]" />
          {!collapsed && "Public site"}
        </Link>
      </aside>

      <div className="min-w-0 flex-1">
        <header ref={headerRef} className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#e7a4a8]/80 to-transparent" />
          <div className="flex h-[4.25rem] items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/10 lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1 md:flex-none">
              <p className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 sm:block">{kicker}</p>
              <p className="truncate font-display text-base text-white">{current?.label || kicker}</p>
            </div>
            <form
              className="relative hidden min-w-0 flex-1 md:block"
              onSubmit={(event) => {
                event.preventDefault()
                if (results[0]) navigate(results[0].to)
              }}
            >
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                ref={searchRef}
                value={query}
                onFocus={() => setPanel("")}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${kicker.toLowerCase()}`}
                className="w-full max-w-md rounded-full border border-white/10 bg-white/[0.04] py-2 pr-16 pl-10 text-sm outline-none transition placeholder:text-zinc-500 focus:border-violet-400/60 focus:bg-white/[0.07]"
              />
              {!query && (
                <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] tracking-wide text-zinc-500 lg:inline">
                  Ctrl K
                </kbd>
              )}
              {query && (
                <div className="absolute z-40 mt-2 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-raised/95 shadow-lift backdrop-blur-xl">
                  {results.length === 0 && <p className="px-4 py-3 text-sm text-zinc-400">No matching desk.</p>}
                  {results.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.to}
                        type="button"
                        onClick={() => navigate(item.to)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.06]"
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-[#e7a4a8]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-white">{item.label}</span>
                          <span className="block text-[11px] text-zinc-500">{item.group}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </form>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <div className="relative">
                <button
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={panel === "notes"}
                  onClick={() => openPanel("notes")}
                  className={cn(
                    "relative grid h-10 w-10 place-items-center rounded-full border text-zinc-200 transition",
                    panel === "notes"
                      ? "border-violet-400/50 bg-white/10 text-white"
                      : "border-white/10 bg-white/[0.04] hover:border-violet-400/40 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Bell className="h-4 w-4" />
                  {notes.length > 0 && !seen && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
                    </span>
                  )}
                </button>
                {panel === "notes" && (
                  <div className="absolute right-0 z-40 mt-3 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-raised/95 shadow-lift backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                      <p className="text-sm font-semibold text-white">Notifications</p>
                      <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[11px] font-medium text-violet-200">{notes.length}</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2">
                      {notes.length === 0 && <p className="px-3 py-4 text-sm text-zinc-400">You're caught up.</p>}
                      {notes.map((note) => (
                        <div key={note.id} className="rounded-2xl px-3 py-2.5 transition hover:bg-white/[0.05]">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm text-white">{note.title}</p>
                            <p className="shrink-0 text-[11px] text-zinc-500">{note.time}</p>
                          </div>
                          <p className="mt-0.5 text-xs text-zinc-400">{note.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={panel === "account"}
                  aria-haspopup="menu"
                  onClick={() => openPanel("account")}
                  className={cn(
                    "flex items-center gap-2.5 rounded-full border py-1 pr-2 pl-1 transition duration-200",
                    panel === "account"
                      ? "border-violet-400/50 bg-white/10"
                      : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08]",
                  )}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-purple-700 text-[11px] font-semibold text-white">
                    {initials(user?.name)}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-36 truncate text-sm leading-tight font-medium text-white">{user?.name || role}</span>
                    <span className="block max-w-36 truncate text-[11px] leading-tight text-zinc-400">{detail}</span>
                  </span>
                  <ChevronDown className={cn("hidden h-4 w-4 text-zinc-400 transition duration-200 sm:block", panel === "account" && "rotate-180")} />
                </button>
                {panel === "account" && (
                  <div role="menu" className="absolute right-0 z-40 mt-3 w-64 overflow-hidden rounded-3xl border border-white/10 bg-raised/95 p-2 shadow-lift backdrop-blur-xl">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold text-white">{user?.name || role}</p>
                      <p className="truncate text-xs text-zinc-400">{user?.email}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300">{detail}</p>
                    </div>
                    <div className="my-1 h-px bg-white/10" />
                    <Link
                      to={profileTo}
                      role="menuitem"
                      onClick={() => setPanel("")}
                      className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.06]"
                    >
                      <UserRound className="h-4 w-4 text-[#e7a4a8]" />
                      Profile
                    </Link>
                    <Link
                      to="/"
                      role="menuitem"
                      onClick={() => setPanel("")}
                      className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.06]"
                    >
                      <ArrowUpRight className="h-4 w-4 text-[#e7a4a8]" />
                      Public site
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={signOut}
                      className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-rose-100 transition hover:bg-rose-500/15"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {notice}
          <Outlet />
        </div>
      </div>

      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close navigation" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,300px)] flex-col bg-ink-soft p-4 shadow-lift">
            <div className="mb-5 flex items-center justify-between">
              <Logo to={homeTo} />
              <button
                type="button"
                aria-label="Close"
                onClick={() => setMenu(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">{kicker}</p>
            <div className="flex-1 overflow-y-auto pr-1">
              <NavGroups groups={groups} onNavigate={() => setMenu(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
