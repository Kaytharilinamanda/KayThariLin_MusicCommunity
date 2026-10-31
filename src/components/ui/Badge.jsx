import { cn } from "../../lib/format"

const tones = {
  violet: "bg-violet-500/15 text-violet-200 ring-violet-400/30",
  neutral: "bg-white/8 text-zinc-300 ring-white/10",
  green: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
  amber: "bg-amber-500/15 text-amber-100 ring-amber-400/30",
  rose: "bg-rose-500/15 text-rose-100 ring-rose-400/30",
}

export default function Badge({ children, tone = "violet", className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        tones[tone] || tones.violet,
        className,
      )}
    >
      {children}
    </span>
  )
}
