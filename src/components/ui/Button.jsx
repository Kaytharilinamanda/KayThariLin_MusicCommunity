import { Link } from "react-router-dom"
import { cn } from "../../lib/format"

const variants = {
  primary:
    "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-glow hover:brightness-110",
  secondary:
    "border border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10",
  ghost: "text-zinc-200 hover:bg-white/8",
  danger: "border border-rose-400/30 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25",
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
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-tight transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:opacity-50",
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
