import { Link } from "react-router-dom"
import { Music2 } from "lucide-react"

export default function Logo({ to = "/", compact = false }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5" aria-label="Harmony">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#fb7185] to-[#9f1239] shadow-glow transition duration-200 group-hover:scale-105">
        <Music2 className="h-4 w-4 text-white" />
      </span>
      {!compact && <span className="font-display text-lg font-semibold tracking-tight text-[#1c1416]">Harmony</span>}
    </Link>
  )
}
