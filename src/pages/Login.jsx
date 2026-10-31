import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Mail } from "lucide-react"
import AuthShell from "../components/layout/AuthShell"
import Button from "../components/ui/Button"
import { PasswordField, TextField } from "../components/ui/Field"
import { useAppState } from "../context/AppState"
import { api } from "../lib/api"
import { destination } from "../lib/account"
import { useTitle } from "../lib/useTitle"

const roles = [
  { id: "user", label: "User" },
  { id: "organizer", label: "Organizer" },
  { id: "admin", label: "Admin" },
]

export default function Login() {
  useTitle("Login")
  const navigate = useNavigate()
  const location = useLocation()
  const { user, ready, acceptSession, notify } = useAppState()
  const [role, setRole] = useState(location.state?.role === "organizer" ? "organizer" : "user")
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ email: location.state?.email || "", password: "" })
  const [errors, setErrors] = useState({})
  const registered = location.state?.message || ""

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  const passwordValid = form.password.length >= 8

  if (ready && user) return <Navigate to={destination(user, location.state?.from)} replace />

  async function submit(event) {
    event.preventDefault()
    const next = {}
    if (!emailValid) next.email = "Enter a valid email address."
    if (!passwordValid) next.password = "Use at least 8 characters."
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      const data = await api("/api/login", {
        method: "POST",
        body: { email: form.email, password: form.password, role },
      })
      acceptSession(data, remember)
      notify(data.user.status === "pending" ? "Signed in. Organizer access is waiting for admin approval." : "Signed in.")
      navigate(destination(data.user, location.state?.from), { replace: true })
    } catch (error) {
      setErrors({ email: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      image="/images/artists/sai-sai.jpg"
      quote="The best seats are the ones where you can still hear the room breathe."
      quoteBy="Sai Sai Kham Leng · Yangon"
      title="Welcome back"
      subtitle="Users and organizers sign in with the account they registered. The studio has one admin, already created."
      footer={
        role === "admin" ? (
          <span>Admin accounts are created in the database. There is no admin registration.</span>
        ) : (
          <>
            New here?{" "}
            <Link to="/register" className="text-violet-300 hover:text-violet-200">
              Create an account
            </Link>
          </>
        )
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        {registered && (
          <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{registered}</p>
        )}
        <div className="grid grid-cols-3 gap-2">
          {roles.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRole(item.id)}
              className={`rounded-full border px-3 py-2 text-sm ${role === item.id ? "border-violet-400 bg-violet-500/15 text-white" : "border-white/10 text-zinc-300"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {role === "admin" && (
          <div className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4 text-sm text-violet-100">
            <p className="font-medium text-white">Studio admin</p>
            <p className="mt-1">admin@harmony.community</p>
            <p>HarmonyAdmin1</p>
          </div>
        )}
        <TextField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          icon={Mail}
          placeholder="you@studio.com"
          value={form.email}
          error={errors.email}
          valid={!errors.email && emailValid}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        <PasswordField
          id="login-password"
          label="Password"
          autoComplete="current-password"
          placeholder="At least 8 characters"
          value={form.password}
          error={errors.password}
          valid={passwordValid}
          hint={form.password && !passwordValid ? "Keep going — 8 characters opens the door." : ""}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input type="checkbox" className="accent-violet-500" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          Remember this device
        </label>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Login"}
        </Button>
      </form>
    </AuthShell>
  )
}
