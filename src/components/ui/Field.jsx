import { useState } from "react"
import { Eye, EyeOff, Lock } from "lucide-react"
import { cn } from "../../lib/format"

function shell(error, valid) {
  return cn(
    "flex items-center gap-2 rounded-2xl border bg-white/[0.04] px-3 transition",
    error
      ? "border-rose-400/70 ring-2 ring-rose-500/15"
      : valid
        ? "border-emerald-400/50 ring-2 ring-emerald-500/10"
        : "border-white/10 focus-within:border-violet-400/70 focus-within:ring-2 focus-within:ring-violet-500/20",
  )
}

function Message({ error, hint }) {
  if (error) return <span className="mt-1.5 block text-xs text-rose-300">{error}</span>
  if (hint) return <span className="mt-1.5 block text-xs text-zinc-500">{hint}</span>
  return null
}

export function TextField({ label, error, hint, valid, icon: Icon, className = "", id, ...props }) {
  return (
    <label className={cn("block", className)} htmlFor={id}>
      {label && <span className="mb-2 block text-sm font-medium text-zinc-200">{label}</span>}
      <span className={shell(error, valid)}>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-zinc-500" />}
        <input
          id={id}
          className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-500"
          {...props}
        />
      </span>
      <Message error={error} hint={hint} />
    </label>
  )
}

export function PasswordField({ label, error, hint, valid, id, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="block" htmlFor={id}>
      {label && <span className="mb-2 block text-sm font-medium text-zinc-200">{label}</span>}
      <span className={shell(error, valid)}>
        <Lock className="h-4 w-4 shrink-0 text-zinc-500" />
        <input
          id={id}
          type={visible ? "text" : "password"}
          className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-500"
          {...props}
        />
        <button
          type="button"
          className="rounded-full p-1 text-zinc-400 hover:text-white"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
      <Message error={error} hint={hint} />
    </label>
  )
}

export function TextArea({ label, error, hint, valid, id, rows = 4, ...props }) {
  return (
    <label className="block" htmlFor={id}>
      {label && <span className="mb-2 block text-sm font-medium text-zinc-200">{label}</span>}
      <textarea
        id={id}
        rows={rows}
        className={cn(
          "w-full resize-none rounded-2xl border bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500",
          error
            ? "border-rose-400/70 ring-2 ring-rose-500/15"
            : valid
              ? "border-emerald-400/50"
              : "border-white/10 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/20",
        )}
        {...props}
      />
      <Message error={error} hint={hint} />
    </label>
  )
}

export function SelectField({ label, error, hint, id, children, ...props }) {
  return (
    <label className="block" htmlFor={id}>
      {label && <span className="mb-2 block text-sm font-medium text-zinc-200">{label}</span>}
      <select
        id={id}
        className={cn(
          "w-full appearance-none rounded-2xl border bg-ink px-3 py-3 text-sm text-white outline-none",
          error ? "border-rose-400/70" : "border-white/10 focus:border-violet-400/70",
        )}
        {...props}
      >
        {children}
      </select>
      <Message error={error} hint={hint} />
    </label>
  )
}

export function ChoicePills({ options, value, onChange, label }) {
  return (
    <div>
      {label && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {options.map((option) => {
          const active = option === value
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm transition",
                active
                  ? "bg-white text-ink"
                  : "bg-white/5 text-zinc-300 ring-1 ring-white/10 hover:bg-white/10",
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
