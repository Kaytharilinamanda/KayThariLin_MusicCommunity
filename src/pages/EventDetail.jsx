import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Calendar, Check, Clock, MapPin, Minus, Plus } from "lucide-react"
import Button from "../components/ui/Button"
import Container from "../components/ui/Container"
import Cover from "../components/ui/Cover"
import EventPoster from "../components/ui/EventPoster"
import Modal from "../components/ui/Modal"
import { TextField } from "../components/ui/Field"
import EventCard from "../components/cards/EventCard"
import { api } from "../lib/api"
import { cachedRows, loadPublishedEvents, sameCatalog } from "../lib/catalog"
import { useAppState } from "../context/AppState"
import { userGate } from "../lib/account"
import SignInPrompt from "../components/auth/SignInPrompt"
import { longDate, money } from "../lib/format"
import { useTitle } from "../lib/useTitle"

export default function EventDetail() {
  const { id } = useParams()
  const [events, setEvents] = useState(() => cachedRows("events") || [])
  const [ready, setReady] = useState(() => (cachedRows("events") || []).some((item) => item.id === id))
  const event = events.find((item) => item.id === id)
  useTitle(event?.title || "Event")
  const [tierId, setTierId] = useState(event?.tickets?.[0]?.id)

  useEffect(() => {
    let active = true
    loadPublishedEvents()
      .then((rows) => {
        if (!active) return
        setEvents((current) => (sameCatalog(current, rows) ? current : rows))
        const match = rows.find((item) => item.id === id)
        setTierId((current) => current || match?.tickets?.[0]?.id)
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [id])
  const [qty, setQty] = useState(1)
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [guest, setGuest] = useState({ name: "", email: "" })
  const [errors, setErrors] = useState({})
  const { notify, user } = useAppState()
  const navigate = useNavigate()

  const tickets = event?.tickets || []
  const tier = tickets.find((item) => item.id === tierId) || tickets[0]
  const subtotal = (tier?.price || 0) * qty
  const fee = Math.round(subtotal * 0.08)
  const total = subtotal + fee
  const related = useMemo(
    () => events.filter((item) => item.id !== id && item.category === event?.category).slice(0, 3),
    [events, id, event],
  )

  if (!ready) {
    return (
      <Container className="py-32 text-center">
        <p className="text-zinc-400">Loading this event.</p>
      </Container>
    )
  }

  if (!event) {
    return (
      <Container className="py-32 text-center">
        <h1 className="font-display text-4xl text-white">That night is not on the calendar.</h1>
        <Button to="/events" className="mt-6">
          Back to events
        </Button>
      </Container>
    )
  }

  function openCheckout() {
    if (!userGate(user, navigate, notify, `/events/${event.id}`)) return
    setGuest({ name: user.name, email: user.email })
    setOpen(true)
  }

  async function reserve(formEvent) {
    formEvent.preventDefault()
    if (!userGate(user, navigate, notify, `/events/${event.id}`)) return
    const next = {}
    if (!guest.name.trim()) next.name = "Add the name for the tickets."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) next.email = "Use a valid email address."
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      await api("/api/orders", {
        method: "POST",
        body: { eventId: event.id, ticketId: tier.id, qty, name: guest.name.trim(), email: guest.email.trim() },
      })
    } catch (error) {
      notify(error.message)
      return
    }
    setDone(true)
    setOpen(false)
    notify("Tickets reserved. They are listed under your account.")
  }

  return (
    <article>
      <section className="on-media relative overflow-hidden border-b border-white/10">
        <Cover src={event.image} alt="" className="absolute inset-0 h-full w-full scale-110 blur-3xl saturate-150" />
        <div className="absolute inset-0 bg-scrim/80" />
        <Container className="relative pt-28 pb-12">
          <Link to="/events" className="text-sm text-zinc-300 hover:text-white">
            ← All events
          </Link>
          <EventPoster
            event={event}
            variant="billboard"
            titleTag="h1"
            className="mx-auto mt-6 aspect-[3/4] w-full max-w-md shadow-[0_30px_80px_-24px_rgba(0,0,0,0.9)]"
          />
        </Container>
      </section>

      <Container className="grid gap-8 py-10 lg:grid-cols-[1.3fr_0.8fr]">
        <div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [Calendar, longDate(event.date)],
              [Clock, event.time],
              [MapPin, `${event.venue}, ${event.city}`],
            ].map(([Icon, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-panel p-4">
                <Icon className="h-4 w-4 text-violet-300" />
                <p className="mt-2 text-sm text-white">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-2xl text-base leading-7 text-zinc-300">{event.description}</p>
          <h2 className="mt-8 font-display text-2xl text-white">On the bill</h2>
          <ul className="mt-3 space-y-2">
            {(event.lineup || []).map((name) => (
              <li key={name} className="text-sm text-zinc-300">
                {name}
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-3xl border border-white/10 bg-panel p-5">
            <h2 className="font-display text-2xl text-white">Venue</h2>
            <p className="mt-2 text-sm text-zinc-300">{event.venue}</p>
            <p className="text-sm text-zinc-400">{event.address}</p>
            <div className="mt-4 grid h-40 place-items-center rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(180,28,45,0.4),transparent_40%),linear-gradient(160deg,#1c1c28,#0d0d14)]">
              <div className="text-center">
                <MapPin className="mx-auto h-5 w-5 text-violet-300" />
                <p className="mt-2 text-sm text-zinc-300">{event.city}</p>
                <p className="text-xs text-zinc-500">Doors 45 minutes before the set</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-panel p-5 shadow-lift lg:sticky lg:top-24">
          {done ? (
            <div className="py-6 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
                <Check className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-2xl text-white">You are on the list.</h2>
              <p className="mt-2 text-sm text-zinc-400">
                {qty} × {tier.name} for {event.title}. The order is on your account page. Payment stays on this design screen.
              </p>
              <Button to="/account/orders" className="mt-5">
                View order
              </Button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl text-white">Tickets</h2>
              {tickets.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-400">Approved tickets are not on sale for this show yet.</p>
              ) : (
              <>
              <div className="mt-4 space-y-2">
                {tickets.map((option) => {
                  const selected = option.id === tier.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTierId(option.id)}
                      className={`w-full rounded-2xl border p-3 text-left transition ${selected ? "border-violet-400 bg-violet-500/10" : "border-white/10 hover:border-white/25"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-white">{option.name}</p>
                        <p className="text-white">{money(option.price)}</p>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">{option.note}</p>
                      <p className="mt-1 text-xs text-zinc-500">{option.left} left</p>
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-zinc-300">Quantity</p>
                <div className="flex items-center gap-3">
                  <button type="button" aria-label="Decrease quantity" onClick={() => setQty((value) => Math.max(1, value - 1))} className="rounded-full border border-white/15 p-2">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-white">{qty}</span>
                  <button type="button" aria-label="Increase quantity" onClick={() => setQty((value) => Math.min(6, value + 1))} className="rounded-full border border-white/15 p-2">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <dl className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <dt>Subtotal</dt>
                  <dd>{money(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <dt>Service fee</dt>
                  <dd>{money(fee)}</dd>
                </div>
                <div className="flex justify-between text-base text-white">
                  <dt>Total</dt>
                  <dd>{money(total)}</dd>
                </div>
              </dl>
              {user?.role === "user" ? (
                <Button className="mt-5 w-full" onClick={openCheckout}>
                  Reserve tickets
                </Button>
              ) : (
                <div className="mt-5">
                  <SignInPrompt
                    signedIn={Boolean(user)}
                    title="Sign in to order tickets"
                    text="Dates, prices, and the venue stay visible. Booking uses a user account."
                  />
                </div>
              )}
              </>
              )}
            </>
          )}
        </aside>
      </Container>

      {related.length > 0 && (
        <Container className="pb-16">
          <h2 className="mb-4 font-display text-2xl text-white">More {event.category.toLowerCase()}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <EventCard key={item.id} event={item} />
            ))}
          </div>
        </Container>
      )}

      <Modal open={open && !done && Boolean(tier)} title="Reserve tickets" subtitle={tier ? `${qty} × ${tier.name} · ${money(total)}` : ""} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={reserve}>
          <TextField
            id="guest-name"
            label="Name"
            value={guest.name}
            error={errors.name}
            valid={!errors.name && guest.name.trim().length > 1}
            onChange={(input) => setGuest((current) => ({ ...current, name: input.target.value }))}
          />
          <TextField
            id="guest-email"
            label="Email"
            type="email"
            value={guest.email}
            error={errors.email}
            valid={!errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)}
            onChange={(input) => setGuest((current) => ({ ...current, email: input.target.value }))}
          />
          <Button type="submit" className="w-full">
            Confirm reservation
          </Button>
        </form>
      </Modal>
    </article>
  )
}
