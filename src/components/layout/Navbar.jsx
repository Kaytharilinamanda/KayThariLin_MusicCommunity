import { useState } from "react"
import { NavLink } from "react-router-dom"
import { Bell, CalendarDays, Drum, GraduationCap, Home, Megaphone, Menu, Users, X } from "lucide-react"
import Logo from "./Logo"
import Button from "../ui/Button"
import Container from "../ui/Container"
import { useAppState } from "../../context/AppState"
import { homeFor, roleLabel } from "../../lib/account"
import { cn } from "../../lib/format"
import { Avatar } from "../account/ProfilePhoto"

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
    "group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-3 py-2 text-sm font-medium",
    active
      ? "bg-gradient-to-r from-[#e11d48] to-[#9f1239] text-[#fff] shadow-[0_10px_24px_-14px_rgba(225,29,72,0.85)]"
      : "text-[#5c464c] hover:text-[#fff]",
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
        {({ isActive }) => (
          <>
            {!isActive && (
              <span className="absolute inset-0 origin-left scale-x-0 rounded-full bg-[#e11d48] transition-transform duration-300 ease-out group-hover:scale-x-100" />
            )}
            <Icon className="relative z-10 h-4 w-4 shrink-0 transition duration-200 group-hover:scale-110" />
            <span className="relative z-10">{link.label}</span>
          </>
        )}
      </NavLink>
    )
  })
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAppState()

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="relative border-b border-[#f3d6da] bg-raised/80 shadow-[0_16px_40px_-28px_rgba(120,40,50,0.45)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#fb7185] to-transparent" />
        <Container className="flex h-[4.25rem] items-center justify-between gap-3">
          <Logo />
          <nav className="hidden items-center gap-1 rounded-full border border-[#f3d6da] bg-[#fff7f7] p-1 lg:flex">
            <NavItems />
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <>
                <NavLink
                  to="/notifications"
                  aria-label="Notifications"
                  className={({ isActive }) =>
                    cn(
                      "grid h-10 w-10 place-items-center rounded-full border shadow-sm transition hover:-translate-y-0.5",
                      isActive
                        ? "border-[#fda4af] bg-[#fff1f2] text-[#9f1239]"
                        : "border-[#f3d6da] bg-raised text-[#6f5960] hover:border-[#fda4af] hover:text-[#9f1239]",
                    )
                  }
                >
                  <Bell className="h-4 w-4" />
                </NavLink>
                <Avatar user={user} className="h-8 w-8 text-[11px]" />
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
            className="rounded-full border border-[#fecdd3] bg-raised p-2 text-[#9f1239] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff1f2] lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </Container>
      </div>
      {open && (
        <div className="lg:hidden">
          <button type="button" aria-label="Close menu" className="fixed inset-0 top-[4.25rem] bg-[#1c1416]/35" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-3 top-[4.6rem] rounded-3xl border border-[#f3d6da] bg-raised p-3 shadow-[0_24px_60px_-24px_rgba(120,40,50,0.35)]">
            <nav className="flex flex-col gap-1">
              <NavItems stacked onNavigate={() => setOpen(false)} />
            </nav>
            <div className="mt-3 flex gap-2">
              {user ? (
                <>
                  <Button to="/notifications" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                    Notifications
                  </Button>
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
