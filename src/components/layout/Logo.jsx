import { Link } from "react-router-dom"
import { Music2 } from "lucide-react"

export default function Logo({ to = "/", compact = false }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="Harmony">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-400 to-purple-700 shadow-glow">
        <Music2 className="h-4 w-4 text-white" />
      </span>
      {!compact && <span className="font-display text-lg font-semibold tracking-tight text-white">Harmony</span>}
    </Link>
  )
}
