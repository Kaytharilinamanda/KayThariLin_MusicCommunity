import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { Building2, Mail, MapPin, Phone, User } from "lucide-react"
import AuthShell from "../components/layout/AuthShell"
import Button from "../components/ui/Button"
import { PasswordField, TextField } from "../components/ui/Field"
import { useAppState } from "../context/AppState"
import { api } from "../lib/api"
import { homeFor } from "../lib/account"
import { useTitle } from "../lib/useTitle"

const roles = [
  { id: "user", label: "User" },
  { id: "organizer", label: "Organizer" },
]

const empty = { name: "", email: "", password: "", confirm: "", phone: "", city: "", organization: "" }

export default function Register() {
  useTitle("Register")
  const navigate = useNavigate()
  const { user, ready } = useAppState()
  const [role, setRole] = useState("user")
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  const passwordValid = form.password.length >= 8
  const confirmValid = form.confirm.length > 0 && form.confirm === form.password
  const nameValid = form.name.trim().length > 1

  if (ready && user) return <Navigate to={homeFor(user)} replace />

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    const next = {}
    if (!nameValid) next.name = "Add the name you want on the account."
    if (!emailValid) next.email = "Enter a valid email address."
    if (!passwordValid) next.password = "Use at least 8 characters."
    if (form.confirm !== form.password) next.confirm = "Those passwords do not match."
    if (role === "organizer" && form.organization.trim().length < 2) next.organization = "Add the organizer or company name."
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      await api("/api/register", {
        method: "POST",
        body: {
          name: form.name,
          email: form.email,
          password: form.password,
          role,
          phone: form.phone,
          city: form.city,
          organization: role === "organizer" ? form.organization : "",
        },
      })
      const message =
        role === "organizer"
          ? "Organizer account created. Sign in after an admin approves it."
          : "Account created. Sign in with your email and password."
      navigate("/login", {
        replace: true,
        state: { message, email: form.email.trim().toLowerCase(), role },
      })
    } catch (error) {
      setErrors({ email: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      image="/images/artists/po-po.jpg"
      quote="Come for a lesson. Stay because somebody remembered your name."
      quoteBy="Po Po · Yangon"
      title="Join Harmony"
      subtitle="Create a user account, or request an organizer account. Admin is a single studio login and is not registered here."
      footer={
        <>
          Already have a profile?{" "}
          <Link to="/login" className="text-violet-300 hover:text-violet-200">
            Login
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-2">
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
        <TextField id="reg-name" label="Name" autoComplete="name" icon={User} value={form.name} error={errors.name} valid={nameValid} onChange={(event) => update("name", event.target.value)} />
        <TextField id="reg-email" label="Email" type="email" autoComplete="email" icon={Mail} value={form.email} error={errors.email} valid={!errors.email && emailValid} onChange={(event) => update("email", event.target.value)} />
        <TextField id="reg-phone" label="Phone" type="tel" autoComplete="tel" icon={Phone} value={form.phone} onChange={(event) => update("phone", event.target.value)} />
        <TextField id="reg-city" label="City" autoComplete="address-level2" icon={MapPin} placeholder="Yangon" value={form.city} onChange={(event) => update("city", event.target.value)} />
        {role === "organizer" && (
          <TextField
            id="reg-org"
            label="Organizer or company"
            icon={Building2}
            value={form.organization}
            error={errors.organization}
            valid={form.organization.trim().length > 1}
            onChange={(event) => update("organization", event.target.value)}
          />
        )}
        <PasswordField id="reg-password" label="Password" autoComplete="new-password" value={form.password} error={errors.password} valid={passwordValid} onChange={(event) => update("password", event.target.value)} />
        <PasswordField id="reg-confirm" label="Confirm password" autoComplete="new-password" value={form.confirm} error={errors.confirm} valid={confirmValid} onChange={(event) => update("confirm", event.target.value)} />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Creating account…" : role === "organizer" ? "Request organizer access" : "Create user account"}
        </Button>
      </form>
    </AuthShell>
  )
}
