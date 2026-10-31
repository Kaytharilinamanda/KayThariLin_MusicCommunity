export const TOKEN_KEY = "harmony-token"

export function readToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || ""
}

export function saveToken(token, remember) {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  const store = remember ? localStorage : sessionStorage
  store.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export function homeFor(user) {
  if (user?.role === "admin") return "/admin"
  if (user?.role === "organizer") return "/organizer"
  return "/account"
}

export function destination(user, from) {
  if (!from || typeof from !== "string") return homeFor(user)
  if (user.role === "admin" && from.startsWith("/admin")) return from
  if (user.role === "organizer" && from.startsWith("/organizer")) return from
  if (user.role === "user" && !from.startsWith("/admin") && !from.startsWith("/organizer")) return from
  return homeFor(user)
}

export function roleLabel(role) {
  if (role === "organizer") return "Organizer"
  if (role === "admin") return "Admin"
  return "User"
}

export function statusLabel(status) {
  if (!status) return ""
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function userGate(user, navigate, notify, from) {
  if (!user) {
    navigate("/login", { state: { from } })
    return false
  }
  if (user.role !== "user") {
    notify("This action is available on a user account.")
    return false
  }
  return true
}
