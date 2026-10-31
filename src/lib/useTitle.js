import { useEffect } from "react"

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Harmony` : "Harmony · Music Community"
  }, [title])
}
