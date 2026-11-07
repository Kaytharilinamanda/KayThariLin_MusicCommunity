import { useState } from "react"
import { Eye, EyeOff, Lock } from "lucide-react"
import { cn } from "../../lib/format"

function shell(error, valid) {
  return cn(
    "flex items-center gap-2 rounded-2xl border bg-[#fffdfb] px-3 shadow-sm transition",
    error
      ? "border-[#fb7185] ring-2 ring-[#fecdd3]"
      : valid
        ? "border-[#34d399] ring-2 ring-[#d1fae5]"
        : "border-[#ead7da] focus-within:border-[#fb7185] focus-within:ring-2 focus-within:ring-[#ffe4e6]",
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
          className="w-full bg-transparent py-3 text-sm text-[#1c1416] outline-none placeholder:text-[#a89499]"
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
          className="w-full bg-transparent py-3 text-sm text-[#1c1416] outline-none placeholder:text-[#a89499]"
          {...props}
        />
        <button
          type="button"
          className="rounded-full p-1 text-[#8a737a] transition hover:bg-[#fff1f2] hover:text-[#9f1239]"
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
          "w-full resize-none rounded-2xl border bg-[#fffdfb] px-3 py-3 text-sm text-[#1c1416] shadow-sm outline-none placeholder:text-[#a89499]",
          error
            ? "border-[#fb7185] ring-2 ring-[#fecdd3]"
            : valid
              ? "border-[#34d399]"
              : "border-[#ead7da] focus:border-[#fb7185] focus:ring-2 focus:ring-[#ffe4e6]",
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
          "w-full appearance-none rounded-2xl border bg-[#fffdfb] px-3 py-3 text-sm text-[#1c1416] shadow-sm outline-none",
          error ? "border-[#fb7185]" : "border-[#ead7da] focus:border-[#fb7185]",
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
      <div className="flex gap-2 overflow-x-auto px-0.5 py-1.5">
        {options.map((option) => {
          const active = option === value
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "group relative shrink-0 overflow-hidden rounded-full px-4 py-2 text-sm font-medium",
                active
                  ? "bg-[#e11d48] text-[#fff] shadow-[0_8px_18px_-12px_rgba(225,29,72,0.9)]"
                  : "bg-raised text-[#5c464c] ring-1 ring-[#ead7da] hover:text-[#fff] hover:ring-transparent hover:shadow-[0_10px_22px_-12px_rgba(225,29,72,0.85)]",
              )}
            >
              {!active && (
                <span className="absolute inset-0 origin-left scale-x-0 bg-[#e11d48] transition-transform duration-300 ease-out group-hover:scale-x-100" />
              )}
              <span className="relative z-10">{option}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
