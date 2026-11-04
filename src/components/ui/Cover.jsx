import { useState } from "react"
import { cn } from "../../lib/format"

export default function Cover({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        className={cn("bg-gradient-to-br from-violet-900 via-purple-950 to-scrim", className)}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
    />
  )
}
