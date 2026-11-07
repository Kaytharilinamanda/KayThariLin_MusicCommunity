import { Link } from "react-router-dom"
import Logo from "./Logo"
import Container from "../ui/Container"

const explore = [
  { to: "/events", label: "Events" },
  { to: "/workshops", label: "Workshops" },
  { to: "/courses", label: "Music Courses" },
  { to: "/community", label: "Community" },
]

const year = new Date().getFullYear()

const studios = [
  "Violet Street Academy",
  "Northlight Music Lab",
  "The Resonance Center",
  "Harbor Conservatory",
]

export default function Footer() {
  return (
    <footer className="border-t border-[#f3d6da] bg-raised/70">
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-400">
            Concerts, workshops, and teachers, gathered for people who stay after the encore.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {explore.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="transition hover:text-[#9f1239]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Studios</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {studios.map((studio) => (
              <li key={studio}>{studio}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Visit</p>
          <p className="mt-4 text-sm leading-6 text-zinc-300">
            Level 4, 22 Pansodan Street
            <br />
            Yangon
          </p>
          <p className="mt-3 text-sm text-zinc-300">hello@harmony.community</p>
          <Link to="/admin" className="mt-4 inline-block text-sm text-[#be123c] transition hover:text-[#9f1239]">
            Admin studio
          </Link>
        </div>
      </Container>
      <div className="border-t border-[#f3d6da]">
        <Container className="flex flex-col gap-2 py-5 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Harmony. A design preview with sample listings.</p>
          <p>Yangon · Mandalay · Naypyidaw</p>
        </Container>
      </div>
    </footer>
  )
}
