import { useState } from "react"
import { NavLink } from "react-router-dom"
import { CalendarDays, Drum, GraduationCap, Home, Megaphone, Menu, Users, X } from "lucide-react"
import Logo from "./Logo"
import Button from "../ui/Button"
import ThemeToggle from "../ui/ThemeToggle"
import Container from "../ui/Container"
import { useAppState } from "../../context/AppState"
import { homeFor, roleLabel } from "../../lib/account"
import { cn } from "../../lib/format"

const links = [
  { to: "/", label: "Home", end: true, icon: Home },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/workshops", label: "Workshops", icon: Drum },
  { to: "/courses", label: "Courses", icon: GraduationCap },
  { to: "/community", label: "Community", icon: Users },
  { to: "/announcements", label: "News", icon: Megaphone },
]

function linkClass(active) {
  return cn(
    "group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition duration-200",
    active
      ? "bg-gradient-to-r from-[#8e1a28] via-[#d64550] to-[#e7a4a8] text-white shadow-[0_10px_24px_-14px_rgba(214,69,80,0.95)]"
      : "text-zinc-300 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white",
  )
}

function NavItems({ onNavigate, stacked = false }) {
  return links.map((link) => {
    const Icon = link.icon
    return (
      <NavLink
        key={link.to}
        to={link.to}
        end={link.end}
        onClick={onNavigate}
        className={({ isActive }) => cn(linkClass(isActive), stacked && "w-full")}
      >
        <Icon className="h-4 w-4 shrink-0 transition duration-200 group-hover:scale-110" />
        {link.label}
      </NavLink>
    )
  })
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAppState()

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="relative border-b border-white/10 bg-ink/80 shadow-[0_18px_50px_-28px_rgba(180,35,52,0.85)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#e7a4a8] to-transparent" />
        <Container className="flex h-[4.25rem] items-center justify-between gap-3">
          <Logo />
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 lg:flex">
            <NavItems />
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <>
                <span className="max-w-32 truncate text-sm text-zinc-300">{user.name}</span>
                <Button to={homeFor(user)} variant="secondary">
                  {roleLabel(user.role)}
                </Button>
                <Button variant="ghost" onClick={signOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button to="/login" variant="secondary">
                  Login
                </Button>
                <Button to="/register">Join</Button>
              </>
            )}
            </div>
          </div>
          <button
            type="button"
            className="rounded-full border border-[#e7a4a8]/40 bg-[#b42334]/20 p-2 text-white transition hover:bg-[#b42334]/40 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </Container>
      </div>
      {open && (
        <div className="lg:hidden">
          <button type="button" aria-label="Close menu" className="fixed inset-0 top-[4.25rem] bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-3 top-[4.6rem] rounded-3xl border border-white/10 bg-raised/95 p-3 shadow-[0_24px_60px_-24px_rgba(180,35,52,0.8)] backdrop-blur-xl">
            <nav className="flex flex-col gap-1">
              <NavItems stacked onNavigate={() => setOpen(false)} />
            </nav>
            <div className="mt-3 flex gap-2">
              {user ? (
                <>
                  <Button to={homeFor(user)} variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                    {roleLabel(user.role)}
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      signOut()
                      setOpen(false)
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button to="/login" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                    Login
                  </Button>
                  <Button to="/register" className="flex-1" onClick={() => setOpen(false)}>
                    Join
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
