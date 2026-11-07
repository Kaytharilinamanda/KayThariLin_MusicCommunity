import { Link } from "react-router-dom"
import { cn } from "../../lib/format"

const variants = {
  primary:
    "bg-gradient-to-r from-[#e11d48] to-[#9f1239] text-white shadow-glow hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-14px_rgba(225,29,72,0.55)] active:translate-y-0",
  secondary:
    "border border-[#f0d5d8] bg-raised text-[#3d2a2e] shadow-sm hover:-translate-y-0.5 hover:border-[#fda4af] hover:bg-[#fff5f6] active:translate-y-0",
  ghost: "text-[#5c464c] hover:bg-[#fff1f2] hover:text-[#9f1239]",
  danger: "border border-[#fecdd3] bg-[#fff1f2] text-[#9f1239] hover:bg-[#ffe4e6]",
}

export default function Button({
  to,
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-tight transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fb7185] disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}
