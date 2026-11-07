import { useRef, useState } from "react"
import { useAppState } from "../../context/AppState"
import { api } from "../../lib/api"
import { cn } from "../../lib/format"

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "H"
  return `${parts[0][0]}${parts[1]?.[0] || ""}`.toUpperCase()
}

export function Avatar({ user, className = "" }) {
  if (user?.avatar) {
    return <img src={user.avatar} alt="" className={cn("rounded-full object-cover", className)} />
  }

  return (
    <span className={cn("grid place-items-center rounded-full bg-[#1c1416] font-semibold text-[#ffffff]", className)}>
      {initials(user?.name)}
    </span>
  )
}

export default function ProfilePhoto() {
  const { user, setUser, notify } = useAppState()
  const input = useRef(null)
  const [preview, setPreview] = useState("")
  const [busy, setBusy] = useState(false)
  const src = preview || user?.avatar || ""

  async function change(event) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      notify("Use a JPG, PNG, WEBP, or GIF photo.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      notify("Choose a photo smaller than 2 MB.")
      return
    }

    const local = URL.createObjectURL(file)
    setPreview(local)
    const body = new FormData()
    body.append("photo", file)
    setBusy(true)
    try {
      const data = await api("/api/me/photo", { method: "POST", body })
      setUser(data.user)
      setPreview("")
      notify("Profile photo saved.")
    } catch (error) {
      setPreview("")
      notify(error.message)
    } finally {
      URL.revokeObjectURL(local)
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      {src ? (
        <img src={src} alt="" className="h-16 w-16 rounded-full object-cover" />
      ) : (
        <Avatar user={user} className="h-16 w-16 text-lg" />
      )}
      <div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={change}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="rounded-full border border-[#e7e5e4] bg-[#ffffff] px-4 py-2 text-sm font-semibold text-[#1c1416] shadow-sm transition hover:bg-[#f5f5f4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Uploading…" : src ? "Change photo" : "Upload photo"}
        </button>
        <p className="mt-2 text-xs text-[#57534e]">JPG, PNG, WEBP, or GIF. Up to 2 MB.</p>
      </div>
    </div>
  )
}
