import { NavLink, Outlet } from "react-router-dom"
import { useState } from "react"
import { Drum, GraduationCap, Star, Ticket, UserRound } from "lucide-react"
import Container from "../../components/ui/Container"
import Button from "../../components/ui/Button"
import { DataTable, Td } from "../../components/ui/DataTable"
import { StatusBadge } from "../../components/admin/ResourceScreen"
import { TextArea, TextField } from "../../components/ui/Field"
import { useAppState } from "../../context/AppState"
import { sampleCourses, sampleOrders, sampleReviews, sampleWorkshops } from "../../data/desk"
import { cn, money } from "../../lib/format"
import { roleLabel, statusLabel } from "../../lib/account"
import { useTitle } from "../../lib/useTitle"

const links = [
  { to: "/account", label: "Profile", end: true, icon: UserRound },
  { to: "/account/orders", label: "Ticket orders", icon: Ticket },
  { to: "/account/workshops", label: "Workshops", icon: Drum },
  { to: "/account/courses", label: "Courses", icon: GraduationCap },
  { to: "/account/feedback", label: "Feedback", icon: Star },
]

export function AccountLayout() {
  return (
    <Container className="grid gap-8 py-28 lg:grid-cols-[220px_1fr]">
      <nav className="h-fit space-y-1 rounded-3xl border border-white/10 bg-panel p-2">
        <p className="px-3 py-2 text-xs uppercase tracking-[0.18em] text-[#f6c9cb]">Your account</p>
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition duration-200",
                  isActive
                    ? "bg-gradient-to-r from-[#8e1a28] to-[#d64550]/25 text-white shadow-[inset_3px_0_0_0_#f6c9cb]"
                    : "text-zinc-400 hover:translate-x-1 hover:bg-white/8 hover:text-white",
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0 text-[#e7a4a8] transition group-hover:scale-110" />
              {link.label}
            </NavLink>
          )
        })}
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

  function save(event) {
    event.preventDefault()
    setUser((current) => (current ? { ...current, ...form } : current))
    notify("Profile updated on this page. Your email stays the one you registered.")
  }

  return (
    <section>
      <h1 className="font-display text-3xl text-white">Profile</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        {roleLabel(user?.role)} · {statusLabel(user?.status)}. Name, phone, and city on this form stay in the browser. The account itself is stored in the database.
      </p>
      <form className="mt-6 max-w-lg space-y-4 rounded-3xl border border-white/10 bg-panel p-5" onSubmit={save}>
        <TextField id="profile-name" label="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        <TextField id="profile-email" label="Email" value={user?.email || ""} readOnly />
        <TextField id="profile-phone" label="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
        <TextField id="profile-city" label="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
        <Button type="submit">Save profile</Button>
      </form>
    </section>
  )
}

function mergeStatus(rows, overrides) {
  return rows.map((row) => ({ ...row, status: overrides[row.id] || row.status }))
}

export function AccountOrders() {
  useTitle("Ticket orders")
  const { myBookings, updateBooking, notify } = useAppState()
  const [overrides, setOverrides] = useState({})
  const rows = mergeStatus([...myBookings.tickets, ...sampleOrders], overrides)

  function mark(row, status, message) {
    if (myBookings.tickets.some((item) => item.id === row.id)) updateBooking("tickets", row.id, { status })
    setOverrides((current) => ({ ...current, [row.id]: status }))
    notify(message)
  }

  return (
    <section>
      <h1 className="font-display text-3xl text-white">Ticket orders</h1>
      <p className="mt-2 mb-6 max-w-2xl text-sm text-zinc-400">
        Orders you reserve while signed in appear first. The other rows are sample bookings so the page has history before your first purchase. Payment stays on this design page.
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
  const { myBookings, updateBooking, notify } = useAppState()
  const [overrides, setOverrides] = useState({})
  const rows = mergeStatus([...myBookings.workshops, ...sampleWorkshops], overrides)

  return (
    <section>
      <h1 className="font-display text-3xl text-white">Workshop registrations</h1>
      <p className="mt-2 mb-6 max-w-2xl text-sm text-zinc-400">Registrations from the workshop pages appear here, with sample seats underneath.</p>
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
                  onClick={() => {
                    if (myBookings.workshops.some((item) => item.id === row.id)) updateBooking("workshops", row.id, { status: "Cancelled" })
                    setOverrides((current) => ({ ...current, [row.id]: "Cancelled" }))
                    notify("Workshop registration cancelled on this page.")
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
  const { myBookings } = useAppState()
  const rows = [...myBookings.courses, ...sampleCourses]

  return (
    <section>
      <h1 className="font-display text-3xl text-white">Course enrollments</h1>
      <p className="mt-2 mb-6 max-w-2xl text-sm text-zinc-400">
        Enrollment requests from a course page land here. Schools, fees, and schedules stay on the course pages.
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

export function AccountFeedback() {
  useTitle("Feedback")
  const { myBookings, addBooking, notify } = useAppState()
  const [form, setForm] = useState({ target: "One Night", kind: "Event", rating: "5", text: "" })
  const rows = [...myBookings.reviews, ...sampleReviews]

  function submit(event) {
    event.preventDefault()
    if (form.text.trim().length < 4) {
      notify("Add a short note before sending feedback.")
      return
    }
    addBooking("reviews", {
      id: `RV-${Date.now().toString().slice(-6)}`,
      target: form.target,
      kind: form.kind,
      rating: Number(form.rating),
      text: form.text.trim(),
      date: new Date().toISOString().slice(0, 10),
    })
    setForm((current) => ({ ...current, text: "" }))
    notify("Feedback saved on this page.")
  }

  return (
    <section>
      <h1 className="font-display text-3xl text-white">Feedback</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">Reviews for events, workshops, and courses. New notes stay in this browser session.</p>
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
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-zinc-200">Rating</span>
          <select className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white" value={form.rating} onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}>
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
        </label>
        <div className="sm:col-span-2">
          <TextArea id="fb-text" label="Your note" value={form.text} onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} />
        </div>
        <Button type="submit">Send feedback</Button>
      </form>
      <div className="mt-6">
        <DataTable
          columns={["About", "Kind", "Rating", "Note"]}
          rows={rows}
          empty="No feedback yet."
          render={(row) => (
            <>
              <Td className="font-medium text-white">{row.target}</Td>
              <Td>{row.kind}</Td>
              <Td>{row.rating}</Td>
              <Td>{row.text}</Td>
            </>
          )}
        />
      </div>
    </section>
  )
}
