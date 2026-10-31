import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Calendar, Check, MapPin, Users } from "lucide-react"
import Button from "../components/ui/Button"
import Container from "../components/ui/Container"
import Cover from "../components/ui/Cover"
import { SelectField, TextArea, TextField } from "../components/ui/Field"
import { workshops } from "../data/content"
import { useAppState } from "../context/AppState"
import { userGate } from "../lib/account"
import SignInPrompt from "../components/auth/SignInPrompt"
import { longDate, money } from "../lib/format"
import { useTitle } from "../lib/useTitle"

const empty = { name: "", email: "", phone: "", level: "Some experience", note: "" }

export default function WorkshopDetail() {
  const { id } = useParams()
  const workshop = workshops.find((item) => item.id === id)
  useTitle(workshop?.title || "Workshop")
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(false)
  const { notify, user, addBooking } = useAppState()
  const navigate = useNavigate()

  if (!workshop) {
    return (
      <Container className="py-32 text-center">
        <h1 className="font-display text-4xl text-white">That workshop is not listed.</h1>
        <Button to="/workshops" className="mt-6">
          Back to workshops
        </Button>
      </Container>
    )
  }

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submit(event) {
    event.preventDefault()
    if (!userGate(user, navigate, notify, `/workshops/${workshop.id}`)) return
    const next = {}
    if (form.name.trim().length < 2) next.name = "Add your name."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Use a valid email address."
    if (form.phone.trim().length < 6) next.phone = "Add a phone number."
    setErrors(next)
    if (Object.keys(next).length) return
    addBooking("workshops", {
      id: `WR-${Date.now().toString().slice(-6)}`,
      title: workshop.title,
      date: workshop.date,
      city: workshop.city,
      status: "Confirmed",
    })
    setDone(true)
    notify("Registered. The seat is listed under your account.")
  }

  return (
    <article>
      <section className="relative min-h-[58vh]">
        <Cover src={workshop.image} alt="" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
        <Container className="relative flex min-h-[58vh] flex-col justify-end pt-28 pb-10">
          <Link to="/workshops" className="mb-6 text-sm text-zinc-300 hover:text-white">
            ← All workshops
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">{workshop.category}</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl text-white sm:text-6xl">{workshop.title}</h1>
        </Container>
      </section>
      <Container className="grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <Cover src={workshop.avatar} alt="" className="h-14 w-14 rounded-full" />
            <div>
              <p className="text-white">{workshop.instructor}</p>
              <p className="text-sm text-zinc-400">{workshop.instructorRole}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              [Calendar, `${longDate(workshop.date)} · ${workshop.time}`],
              [MapPin, `${workshop.location}, ${workshop.city}`],
              [Users, `${workshop.seats} seats`],
            ].map(([Icon, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-panel p-4 text-sm text-zinc-200">
                <Icon className="mb-2 h-4 w-4 text-violet-300" />
                {label}
              </div>
            ))}
          </div>
          <p className="mt-8 text-base leading-7 text-zinc-300">{workshop.description}</p>
          <h2 className="mt-8 font-display text-2xl text-white">You will leave with</h2>
          <ul className="mt-4 space-y-3">
            {workshop.learn.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <aside className="h-fit rounded-3xl border border-white/10 bg-panel p-5 shadow-lift lg:sticky lg:top-24">
          <p className="text-sm text-zinc-400">Fee</p>
          <p className="font-display text-4xl text-white">{money(workshop.fee)}</p>
          {done ? (
            <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              You are registered for {workshop.title}. Open your account to manage the seat.
            </div>
          ) : user?.role !== "user" ? (
            <div className="mt-5">
              <SignInPrompt
                signedIn={Boolean(user)}
                title="Sign in to register"
                text="Workshop details stay open. A seat needs a user account."
              />
            </div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={submit}>
              <TextField id="ws-name" label="Full name" value={form.name} error={errors.name} onChange={(event) => update("name", event.target.value)} />
              <TextField id="ws-email" label="Email" type="email" value={form.email} error={errors.email} onChange={(event) => update("email", event.target.value)} />
              <TextField id="ws-phone" label="Phone" type="tel" value={form.phone} error={errors.phone} onChange={(event) => update("phone", event.target.value)} />
              <SelectField id="ws-level" label="Experience" value={form.level} onChange={(event) => update("level", event.target.value)}>
                <option>Just starting</option>
                <option>Some experience</option>
                <option>Already performing</option>
              </SelectField>
              <TextArea id="ws-note" label="Anything we should know" value={form.note} onChange={(event) => update("note", event.target.value)} />
              <Button type="submit" className="w-full">
                Register
              </Button>
            </form>
          )}
        </aside>
      </Container>
    </article>
  )
}
