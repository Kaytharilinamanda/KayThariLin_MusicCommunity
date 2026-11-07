import { cn } from "../../lib/format"

const tones = {
  violet: "bg-raised text-[#9f1239] ring-[#fecdd3] shadow-sm",
  neutral: "bg-raised/95 text-[#57534e] ring-[#e7e5e4] shadow-sm",
  green: "bg-raised text-[#047857] ring-[#a7f3d0] shadow-sm",
  amber: "bg-raised text-[#b45309] ring-[#fde68a] shadow-sm",
  rose: "bg-raised text-[#be123c] ring-[#fecdd3] shadow-sm",
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
