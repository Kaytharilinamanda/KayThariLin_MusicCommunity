import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { currentTheme, setTheme, subscribeTheme } from "../../lib/theme"
import { cn } from "../../lib/format"

export default function ThemeToggle({ className = "" }) {
  const [theme, setLocal] = useState(currentTheme)
  useEffect(() => subscribeTheme(setLocal), [])
  const light = theme === "light"

  return (
    <button
      type="button"
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={light}
      onClick={() => setTheme(light ? "dark" : "light")}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-200 transition hover:border-violet-400/40 hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  )
}
