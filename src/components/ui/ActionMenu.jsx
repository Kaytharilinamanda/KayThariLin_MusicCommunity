import { useEffect, useState } from "react"
import { MoreHorizontal } from "lucide-react"

export default function ActionMenu({ items }) {
  const [pos, setPos] = useState(null)

  useEffect(() => {
    if (!pos) return undefined
    const close = () => setPos(null)
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => {
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
    }
  }, [pos])

  return (
    <>
      <button
        type="button"
        aria-label="Open actions"
        aria-expanded={Boolean(pos)}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
        }}
        className="rounded-full border border-white/10 p-2 text-zinc-300 hover:bg-white/8 hover:text-white"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {pos && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close menu" onClick={() => setPos(null)} />
          <div
            className="fixed z-50 w-44 rounded-xl border border-white/10 bg-raised p-1 shadow-lift"
            style={{ top: pos.top, right: pos.right }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setPos(null)
                  item.onClick()
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/8 ${item.danger ? "text-rose-200" : "text-zinc-200"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}
