import { NavLink, Outlet } from "react-router-dom"
import { useEffect, useState } from "react"
import { Bell, Drum, GraduationCap, Star, Ticket, UserRound } from "lucide-react"
import Container from "../../components/ui/Container"
import Button from "../../components/ui/Button"
import { DataTable, Td } from "../../components/ui/DataTable"
import { StatusBadge } from "../../components/admin/ResourceScreen"
import { TextArea, TextField } from "../../components/ui/Field"
import { useAppState } from "../../context/AppState"
import { api } from "../../lib/api"
import { cn, money } from "../../lib/format"
import { roleLabel, statusLabel } from "../../lib/account"
import { useTitle } from "../../lib/useTitle"
import ProfilePhoto from "../../components/account/ProfilePhoto"

const links = [
  { to: "/account", label: "Profile", end: true, icon: UserRound },
  { to: "/account/orders", label: "Ticket orders", icon: Ticket },
  { to: "/account/workshops", label: "Workshops", icon: Drum },
  { to: "/account/courses", label: "Courses", icon: GraduationCap },
  { to: "/account/feedback", label: "Feedback", icon: Star },
  { to: "/notifications", label: "Notifications", icon: Bell },
]

export function AccountLayout() {
  return (
    <Container className="grid gap-8 py-28 lg:grid-cols-[248px_1fr]">
      <nav className="h-fit rounded-3xl border border-[#e7e5e4] bg-[#ffffff] p-2.5 shadow-[0_18px_40px_-28px_rgba(28,20,22,0.18)]">
        <p className="px-3 pt-1.5 pb-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#57534e]">Your account</p>
        <div className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-2xl px-2.5 py-2 text-sm font-medium outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[#a8a29e]",
                    isActive ? "bg-[#1c1416] text-[#ffffff]" : "text-[#1c1416] hover:bg-[#f5f5f4]",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
                        isActive ? "bg-[#ffffff]/15 text-[#ffffff]" : "bg-[#f5f5f4] text-[#1c1416]",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {link.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
      <div>
        <Outlet />
      </div>
    </Container>
  )
}

export function AccountProfile() {
  useTitle("Profile")
  const { user, setUser, notify } = useAppState()
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    city: user?.city || "",
  })

  async function save(event) {
    event.preventDefault()
    try {
      const data = await api("/api/me", { method: "PATCH", body: form })
      setUser(data.user)
      notify("Profile saved. Your email stays the one you registered.")
    } catch (error) {
      notify(error.message)
    }
  }

  return (
    <section>
      <h1 className="font-display text-3xl text-white">Profile</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        {roleLabel(user?.role)} · {statusLabel(user?.status)}. Name, phone, city, and your photo are saved to your account.
      </p>
      <form className="mt-6 max-w-lg space-y-4 rounded-3xl border border-white/10 bg-panel p-5" onSubmit={save}>
        <ProfilePhoto />
        <TextField id="profile-name" label="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        <TextField id="profile-email" label="Email" value={user?.email || ""} readOnly />
        <TextField id="profile-phone" label="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
        <TextField id="profile-city" label="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
        <Button type="submit">Save profile</Button>
      </form>
    </section>
  )
}

export function AccountOrders() {
  useTitle("Ticket orders")
  const { notify } = useAppState()
  const [rows, setRows] = useState([])

  useEffect(() => {
    api("/api/orders").then((data) => setRows(data.orders || [])).catch((error) => notify(error.message))
  }, [notify])

  async function mark(row, status, message) {
    try {
      const data = await api(`/api/orders/${row.recordId}`, { method: "PATCH", body: { status } })
      setRows((current) => current.map((item) => (item.recordId === row.recordId ? data.order : item)))
      notify(message)
    } catch (error) {
      notify(error.message)
    }
  }

  return (
    <section>
      <h1 className="font-display text-3xl text-white">Ticket orders</h1>
      <p className="mt-2 mb-6 max-w-2xl text-sm text-zinc-400">
        Reservations you confirm are stored with your account. Cancel returns the seats. A refund request is recorded for the organizer.
      </p>
      <DataTable
        columns={["Order", "Tickets", "Total", "Status", ""]}
        rows={rows}
        empty="No ticket orders yet."
        render={(row) => (
          <>
            <Td className="text-white">
              <p className="font-medium">{row.event}</p>
              <p className="text-xs text-zinc-500">{row.id} · {row.date}</p>
            </Td>
            <Td>{row.qty} × {row.tier}</Td>
            <Td>{money(row.total)}</Td>
            <Td><StatusBadge status={row.status} /></Td>
            <Td>
              {row.status === "Paid" || row.status === "Pending" ? (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => mark(row, "Refund requested", "Refund request saved on this page.")}>
                    Refund
                  </Button>
                  <Button variant="ghost" onClick={() => mark(row, "Cancelled", "Cancellation saved on this page.")}>
                    Cancel
                  </Button>
                </div>
              ) : null}
            </Td>
          </>
        )}
      />
    </section>
  )
}

export function AccountWorkshops() {
  useTitle("Workshop registrations")
  const { notify } = useAppState()
  const [rows, setRows] = useState([])

  useEffect(() => {
    api("/api/workshop-registrations").then((data) => setRows(data.registrations || [])).catch((error) => notify(error.message))
  }, [notify])

  return (
    <section>
      <h1 className="font-display text-3xl text-white">Workshop registrations</h1>
      <p className="mt-2 mb-6 max-w-2xl text-sm text-zinc-400">Registrations from the workshop pages are stored on your account.</p>
      <DataTable
        columns={["Workshop", "When", "City", "Status", ""]}
        rows={rows}
        empty="No workshop registrations yet."
        render={(row) => (
          <>
            <Td className="font-medium text-white">{row.title}</Td>
            <Td>{row.date}</Td>
            <Td>{row.city}</Td>
            <Td><StatusBadge status={row.status} /></Td>
            <Td>
              {row.status === "Confirmed" && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const data = await api(`/api/workshop-registrations/${row.id}`, { method: "PATCH", body: { status: "Cancelled" } })
                      setRows((current) => current.map((item) => (item.id === row.id ? data.registration : item)))
                      notify("Workshop registration cancelled.")
                    } catch (error) {
                      notify(error.message)
                    }
                  }}
                >
                  Cancel
                </Button>
              )}
            </Td>
          </>
        )}
      />
    </section>
  )
}

export function AccountCourses() {
  useTitle("Course enrollments")
  const { notify } = useAppState()
  const [rows, setRows] = useState([])

  useEffect(() => {
    api("/api/enrollments").then((data) => setRows(data.enrollments || [])).catch((error) => notify(error.message))
  }, [notify])

  return (
    <section>
      <h1 className="font-display text-3xl text-white">Course enrollments</h1>
      <p className="mt-2 mb-6 max-w-2xl text-sm text-zinc-400">
        Enrollment requests from a course page are stored here. Schools, fees, and schedules stay on the course pages.
      </p>
      <DataTable
        columns={["Course", "Learning center", "Date", "Status"]}
        rows={rows}
        empty="No course enrollments yet."
        render={(row) => (
          <>
            <Td className="font-medium text-white">{row.title}</Td>
            <Td>{row.center}</Td>
            <Td>{row.date}</Td>
            <Td><StatusBadge status={row.status} /></Td>
          </>
        )}
      />
    </section>
  )
}

function StarRating({ value, onChange }) {
  const score = Number(value)
  const [hover, setHover] = useState(0)
  const shown = hover || score

  return (
    <div className="block text-sm">
      <span className="mb-2 block font-medium text-zinc-200">Rating</span>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= shown
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={star === score}
              aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
              onMouseEnter={() => setHover(star)}
              onClick={() => onChange(String(star))}
              className={active ? "text-[#e11d48]" : "text-[#d6c4c8]"}
            >
              <Star className={`h-7 w-7 ${active ? "fill-current" : ""}`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function AccountFeedback() {
  useTitle("Feedback")
  const { notify } = useAppState()
  const [form, setForm] = useState({ target: "One Night", kind: "Event", rating: "5", text: "" })
  const [rows, setRows] = useState([])

  useEffect(() => {
    api("/api/reviews").then((data) => setRows(data.reviews || [])).catch((error) => notify(error.message))
  }, [notify])

  async function submit(event) {
    event.preventDefault()
    if (form.text.trim().length < 4) {
      notify("Add a short note before sending feedback.")
      return
    }
    try {
      const data = await api("/api/reviews", { method: "POST", body: { ...form, rating: Number(form.rating) } })
      setRows((current) => [data.review, ...current])
      setForm((current) => ({ ...current, text: "" }))
      notify("Feedback saved.")
    } catch (error) {
      notify(error.message)
    }
  }

  async function remove(row) {
    if (!window.confirm("Delete this feedback?")) return
    try {
      await api(`/api/reviews/${row.id}`, { method: "DELETE" })
      setRows((current) => current.filter((item) => item.id !== row.id))
      notify("Feedback deleted.")
    } catch (error) {
      notify(error.message)
    }
  }

  return (
    <section>
      <h1 className="font-display text-3xl text-white">Feedback</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">Reviews for events, workshops, and courses. New notes are stored with your account.</p>
      <form className="mt-6 grid gap-4 rounded-3xl border border-white/10 bg-panel p-5 sm:grid-cols-2" onSubmit={submit}>
        <TextField id="fb-target" label="Event, workshop, or course" value={form.target} onChange={(event) => setForm((current) => ({ ...current, target: event.target.value }))} />
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-zinc-200">Kind</span>
          <select className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white" value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))}>
            <option>Event</option>
            <option>Workshop</option>
            <option>Course</option>
          </select>
        </label>
        <StarRating value={form.rating} onChange={(rating) => setForm((current) => ({ ...current, rating }))} />
        <div className="sm:col-span-2">
          <TextArea id="fb-text" label="Your note" value={form.text} onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} />
        </div>
        <Button type="submit">Send feedback</Button>
      </form>
      <div className="mt-6">
        <DataTable
          columns={["About", "Kind", "Rating", "Note", ""]}
          rows={rows}
          empty="No feedback yet."
          render={(row) => (
            <>
              <Td className="font-medium text-white">{row.target}</Td>
              <Td>{row.kind}</Td>
              <Td>
                <span className="inline-flex gap-0.5 text-[#e11d48]" aria-label={`${row.rating} out of 5`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`h-3.5 w-3.5 ${star <= Number(row.rating) ? "fill-current" : "text-[#e7d5d8]"}`} />
                  ))}
                </span>
              </Td>
              <Td>{row.text}</Td>
              <Td>
                <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => remove(row)}>
                  Delete
                </Button>
              </Td>
            </>
          )}
        />
      </div>
    </section>
  )
}
