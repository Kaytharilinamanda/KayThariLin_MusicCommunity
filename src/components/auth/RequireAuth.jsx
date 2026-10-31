import { Navigate, useLocation } from "react-router-dom"
import { useAppState } from "../../context/AppState"
import { homeFor } from "../../lib/account"

export default function RequireAuth({ role, children }) {
  const { user, ready } = useAppState()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="grid min-h-svh place-items-center bg-ink text-sm text-zinc-300">Checking your account…</div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (role && user.role !== role) return <Navigate to={homeFor(user)} replace />
  return children
}
