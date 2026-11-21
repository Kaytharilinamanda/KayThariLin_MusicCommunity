import { useEffect, useRef, useState } from "react"
import {
  BadgeDollarSign,
  CalendarDays,
  ClipboardList,
  Drum,
  GraduationCap,
  LayoutDashboard,
  Tags,
  Megaphone,
  MessageSquare,
  Ticket,
  UserRound,
  BarChart3,
  Image,
} from "lucide-react"
import StudioShell from "../../components/layout/StudioShell"
import Button from "../../components/ui/Button"
import { DataTable, Stat, Td } from "../../components/ui/DataTable"
import { AreaChart, BarChart, DonutChart } from "../../components/admin/Charts"
import { StatusBadge } from "../../components/admin/ResourceScreen"
import { SelectField, TextArea, TextField } from "../../components/ui/Field"
import { useAppState } from "../../context/AppState"
import { categories } from "../../data/content"
import { api } from "../../lib/api"
import { fetchDesk, useDeskRows, warmDesk } from "../../lib/deskCache"
import { money } from "../../lib/format"
import { statusLabel } from "../../lib/account"
import { useTitle } from "../../lib/useTitle"
import ProfilePhoto from "../../components/account/ProfilePhoto"

const groups = [
  {
    label: "Desk",
    items: [
      { to: "/organizer", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/organizer/profile", label: "Profile", icon: UserRound },
    ],
  },
  {
    label: "Shows",
    items: [
      { to: "/organizer/events", label: "Events", icon: CalendarDays },
      { to: "/organizer/announcements", label: "Announcements", icon: Megaphone },
      { to: "/organizer/tickets", label: "Tickets", icon: Ticket },
    ],
  },
  {
    label: "Programs",
    items: [
      { to: "/organizer/workshops", label: "Workshops", icon: Drum },
      { to: "/organizer/courses", label: "Courses", icon: GraduationCap },
      { to: "/organizer/categories", label: "Course categories", icon: Tags },
      { to: "/organizer/enrollments", label: "Enrollments", icon: ClipboardList },
    ],
  },
  {
    label: "Box office",
    items: [
      { to: "/organizer/orders", label: "Orders", icon: BadgeDollarSign },
      { to: "/organizer/enquiries", label: "Feedback", icon: MessageSquare },
    ],
  },
  {
    label: "Insights",
    items: [{ to: "/organizer/reports", label: "Reports", icon: BarChart3 }],
  },
]

const warm = [
  "/api/dashboard",
  "/api/events",
  "/api/tickets",
  "/api/orders",
  "/api/announcements/mine?kind=announcement",
  "/api/reviews",
  "/api/programs/workshops",
  "/api/programs/courses",
  "/api/programs/categories",
  "/api/workshop-registrations",
  "/api/enrollments",
  "/api/notifications",
]

export function OrganizerLayout() {
  const { user } = useAppState()
  const { rows: notes } = useDeskRows("/api/notifications", "notifications")

  useEffect(() => warmDesk(warm), [])

  return (
    <StudioShell
      homeTo="/organizer"
      kicker="Organizer desk"
      groups={groups}
      profileTo="/organizer/profile"
      role="Organizer"
      notes={notes}
      notice={
        user?.status === "pending" ? (
          <p className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Your organizer registration is waiting for the studio admin. You can still submit events and tickets. They stay pending, and an approved show is public only after this account is approved too.
          </p>
        ) : null
      }
    />
  )
}

function PageIntro({ title, text }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl text-white">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">{text}</p>
    </div>
  )
}

export function OrganizerHome() {
  useTitle("Organizer")
  const { desk, setDesk } = useAppState()
  const cached = desk?.role === "organizer" ? desk : null
  const [stats, setStats] = useState(cached)
  const view = stats || cached

  useEffect(() => {
    let current = true
    fetchDesk("/api/dashboard")
      .then((data) => {
        if (!current || data.dashboard?.role !== "organizer") return
        setStats(data.dashboard)
        setDesk(data.dashboard)
      })
      .catch(() => {})
    return () => {
      current = false
    }
  }, [setDesk])

  return (
    <section>
      <PageIntro title="Your shows" text="Ticket sales, bookings, and attendance for the events on this organizer account." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Events" value={view ? view.events : "—"} detail={view ? `${view.approved} approved` : "Counting shows"} />
        <Stat label="Ticket sales" value={view ? money(view.sales) : "—"} detail="Confirmed orders for your events" />
        <Stat label="Seats booked" value={view ? view.seats : "—"} detail="Across stored orders" />
      </div>
    </section>
  )
}

export function OrganizerProfile() {
  useTitle("Organizer profile")
  const { user, setUser, notify } = useAppState()
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    city: user?.city || "",
    organization: user?.organization || "",
  })

  async function save(event) {
    event.preventDefault()
    try {
      const data = await api("/api/me", { method: "PATCH", body: form })
      setUser(data.user)
      notify("Organizer profile saved.")
    } catch (error) {
      notify(error.message)
    }
  }

  return (
    <section>
      <PageIntro title="Organizer profile" text={`Status: ${statusLabel(user?.status)}. Contact details and your photo are saved to your account.`} />
      <form className="max-w-lg space-y-4 rounded-3xl border border-white/10 bg-panel p-5" onSubmit={save}>
        <ProfilePhoto />
        <TextField id="org-name" label="Contact name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        <TextField id="org-email" label="Email" value={user?.email || ""} readOnly />
        <TextField id="org-company" label="Organizer or company" value={form.organization} onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))} />
        <TextField id="org-phone" label="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
        <TextField id="org-city" label="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
        <Button type="submit">Save contact details</Button>
      </form>
    </section>
  )
}

const blankEvent = {
  title: "",
  artist: "",
  category: "Pop",
  city: "Yangon",
  venue: "",
  address: "",
  date: "",
  time: "7:00 PM",
  price: "",
  image: "",
  blurb: "",
}

export function OrganizerEvents() {
  useTitle("Organizer events")
  const { notify } = useAppState()
  const { rows: events, ready, reload } = useDeskRows("/api/events", "events")
  const [error, setError] = useState("")
  const [form, setForm] = useState(blankEvent)
  const [editing, setEditing] = useState("")
  const [uploading, setUploading] = useState(false)
  const posterInput = useRef(null)

  async function load() {
    try {
      await reload()
      setError("")
    } catch (err) {
      setError(err.message)
    }
  }

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function choosePoster(event) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      notify("Use a JPG, PNG, WEBP, or GIF poster.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      notify("Choose a poster smaller than 2 MB.")
      return
    }
    const body = new FormData()
    body.append("photo", file)
    setUploading(true)
    try {
      const data = await api("/api/events/image", { method: "POST", body })
      update("image", data.image)
      notify("Poster added to this event.")
    } catch (err) {
      notify(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function save(event) {
    event.preventDefault()
    if (uploading) return
    if (!form.image) {
      notify("Add a poster for this event.")
      return
    }
    try {
      if (editing) {
        await api(`/api/events/${editing}`, { method: "PATCH", body: form })
        notify("Event updated and sent back for approval.")
      } else {
        await api("/api/events", { method: "POST", body: form })
        notify("Event submitted for admin approval.")
      }
      setForm(blankEvent)
      setEditing("")
      load()
    } catch (err) {
      notify(err.message)
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete ${row.title}? Its tickets are deleted with it.`)) return
    try {
      await api(`/api/events/${row.id}`, { method: "DELETE" })
      if (editing === row.id) {
        setEditing("")
        setForm(blankEvent)
      }
      notify("Event deleted.")
      load()
    } catch (err) {
      notify(err.message)
    }
  }

  return (
    <section>
      <PageIntro
        title="Events"
        text="Create, edit, and delete your own shows. Every save submits the event to the admin. Pending, approved, and rejected stay on this list, with the rejection reason when there is one."
      />
      {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}
      <form className="mb-6 grid gap-4 rounded-3xl border border-white/10 bg-panel p-5 sm:grid-cols-2" onSubmit={save}>
        <TextField id="ev-title" label="Title" value={form.title} onChange={(event) => update("title", event.target.value)} />
        <TextField id="ev-artist" label="Artist" value={form.artist} onChange={(event) => update("artist", event.target.value)} />
        <SelectField id="ev-category" label="Category" value={form.category} onChange={(event) => update("category", event.target.value)}>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </SelectField>
        <TextField id="ev-city" label="City" value={form.city} onChange={(event) => update("city", event.target.value)} />
        <TextField id="ev-venue" label="Venue" value={form.venue} onChange={(event) => update("venue", event.target.value)} />
        <TextField id="ev-address" label="Address" value={form.address} onChange={(event) => update("address", event.target.value)} />
        <TextField id="ev-date" label="Date" type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
        <TextField id="ev-time" label="Time" value={form.time} onChange={(event) => update("time", event.target.value)} />
        <TextField id="ev-price" label="From price (USD)" type="number" value={form.price} onChange={(event) => update("price", event.target.value)} />
        <div className="sm:col-span-2">
          <span className="mb-2 block text-sm font-medium text-zinc-200">Poster</span>
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#ead7da] bg-[#fffdfb] p-3">
            {form.image ? (
              <img src={form.image} alt="" className="h-28 w-20 rounded-xl object-cover" />
            ) : (
              <span className="grid h-28 w-20 place-items-center rounded-xl bg-[#fff1f2] text-[#9f1239]">
                <Image className="h-5 w-5" aria-hidden="true" />
              </span>
            )}
            <div>
              <input
                ref={posterInput}
                id="ev-poster"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={choosePoster}
              />
              <Button type="button" variant="secondary" disabled={uploading} onClick={() => posterInput.current?.click()}>
                {uploading ? "Uploading…" : form.image ? "Change poster" : "Upload poster"}
              </Button>
              <p className="mt-2 text-xs text-zinc-500">JPG, PNG, WEBP, or GIF. Up to 2 MB. This is the image on the public event page.</p>
            </div>
          </div>
        </div>
        <div className="sm:col-span-2">
          <TextArea id="ev-blurb" label="Short description" rows={3} value={form.blurb} onChange={(event) => update("blurb", event.target.value)} />
        </div>
        {editing && (
          <p className="text-sm text-amber-100 sm:col-span-2">Saving sends this event back to Pending for the admin, including after a rejection or an earlier approval.</p>
        )}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit">{editing ? "Save and resubmit" : "Submit for approval"}</Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={() => { setEditing(""); setForm(blankEvent) }}>
              Clear
            </Button>
          )}
        </div>
      </form>
      <DataTable
        columns={["Show", "When", "Venue", "Price", "Status", ""]}
        rows={events}
        empty={ready ? "No events yet." : ""}
        render={(row) => (
          <>
            <Td className="text-white">
              <div className="flex items-center gap-3">
                <img src={row.image || "/images/crowd.jpg"} alt="" className="h-14 w-10 rounded-lg object-cover" />
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-xs text-zinc-500">{row.artist}</p>
                </div>
              </div>
            </Td>
            <Td>{row.date} · {row.time}</Td>
            <Td>{row.venue}, {row.city}</Td>
            <Td>{money(row.price)}</Td>
            <Td>
              <StatusBadge status={row.status} />
              {row.status === "Rejected" && row.rejectionReason && (
                <p className="mt-1 max-w-[220px] text-xs text-rose-200">{row.rejectionReason}</p>
              )}
            </Td>
            <Td>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(row.id)
                    setForm({
                      title: row.title,
                      artist: row.artist,
                      category: row.category,
                      city: row.city,
                      venue: row.venue,
                      address: row.address || "",
                      date: row.date,
                      time: row.time,
                      price: String(row.price),
                      image: row.image || "",
                      blurb: row.blurb || "",
                    })
                  }}
                >
                  {row.status === "Rejected" ? "Correct and resubmit" : "Edit"}
                </Button>
                <Button variant="danger" onClick={() => remove(row)}>Delete</Button>
              </div>
            </Td>
          </>
        )}
      />
    </section>
  )
}

function noticePage({ title, text, noun }) {
  return function NoticePage() {
    useTitle(title)
    const { notify } = useAppState()
    const { rows, setRows, ready } = useDeskRows("/api/announcements/mine?kind=announcement", "announcements")
    const [form, setForm] = useState({ title: "", event: "One Night", extra: "" })

    async function submit(event) {
      event.preventDefault()
      if (form.title.trim().length < 3) {
        notify(`Add a title for the ${noun}.`)
        return
      }
      try {
        const data = await api("/api/announcements", {
          method: "POST",
          body: {
            kind: "announcement",
            title: form.title.trim(),
            event: form.event,
            audience: form.extra || "Ticket holders",
          },
        })
        setRows((current) => [data.announcement, ...current])
        setForm({ title: "", event: "One Night", extra: "" })
        notify(`${title} saved.`)
      } catch (error) {
        notify(error.message)
      }
    }

    return (
      <section>
        <PageIntro title={title} text={text} />
        <form className="mb-6 grid gap-4 rounded-3xl border border-white/10 bg-panel p-5 sm:grid-cols-2" onSubmit={submit}>
          <TextField id={`${noun}-title`} label="Title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          <TextField id={`${noun}-event`} label="Event" value={form.event} onChange={(event) => setForm((current) => ({ ...current, event: event.target.value }))} />
          <TextField id={`${noun}-extra`} label="Audience" value={form.extra} onChange={(event) => setForm((current) => ({ ...current, extra: event.target.value }))} />
          <div className="sm:col-span-2">
            <Button type="submit">Publish</Button>
          </div>
        </form>
        <DataTable
          columns={["Title", "Event", "Audience", "Status"]}
          rows={rows}
          empty={ready ? `No ${noun}s yet.` : ""}
          render={(row) => (
            <>
              <Td className="font-medium text-white">{row.title}</Td>
              <Td>{row.event}</Td>
              <Td>{row.audience}</Td>
              <Td><StatusBadge status={row.status} /></Td>
            </>
          )}
        />
      </section>
    )
  }
}

export const OrganizerAnnouncements = noticePage({
  title: "Announcements",
  text: "Notes for people who already hold tickets. New announcements are stored and shown when they are published.",
  noun: "announcement",
})

const ticketTypes = ["General admission", "VIP", "Front row", "Balcony", "Student"]
const blankTicket = { eventId: "", tier: "", price: "", quantity: "", salesStart: "", salesEnd: "" }

export function OrganizerTicketSetup() {
  useTitle("Ticket setup")
  const { notify } = useAppState()
  const { rows: events, ready: eventsReady, reload: reloadEvents } = useDeskRows("/api/events", "events")
  const { rows, setRows, ready, reload: reloadTickets } = useDeskRows("/api/tickets", "tickets")
  const [error, setError] = useState("")
  const [form, setForm] = useState(blankTicket)
  const [editing, setEditing] = useState("")

  useEffect(() => {
    setForm((current) => ({ ...current, eventId: current.eventId || (events[0] ? String(events[0].id) : "") }))
  }, [events])

  async function load() {
    try {
      await Promise.all([reloadEvents(), reloadTickets()])
      setError("")
    } catch (err) {
      setError(err.message)
    }
  }

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    const body = { ...form, eventId: Number(form.eventId), quantity: Number(form.quantity) }
    try {
      if (editing) {
        await api(`/api/tickets/${editing}`, { method: "PATCH", body })
        notify("Ticket updated and sent back for approval.")
      } else {
        await api("/api/tickets", { method: "POST", body })
        notify("Ticket submitted for admin approval.")
      }
      setEditing("")
      setForm({ ...blankTicket, eventId: form.eventId })
      load()
    } catch (err) {
      notify(err.message)
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete the ${row.tier} ticket for ${row.event}?`)) return
    try {
      await api(`/api/tickets/${row.id}`, { method: "DELETE" })
      if (editing === row.id) {
        setEditing("")
        setForm({ ...blankTicket, eventId: form.eventId })
      }
      notify("Ticket deleted.")
      load()
    } catch (err) {
      notify(err.message)
    }
  }

  return (
    <section>
      <PageIntro
        title="Tickets"
        text="Create, edit, and delete tickets for your own events. Choose a ticket type, then submit it for approval. You can read Pending, Approved, and Rejected here, then correct a rejection and resubmit."
      />
      {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}
      {eventsReady && events.length === 0 ? (
        <p className="mb-6 rounded-3xl border border-white/10 bg-panel p-5 text-sm text-zinc-400">Submit an event before you add tickets.</p>
      ) : (
        <form className="mb-6 grid gap-4 rounded-3xl border border-white/10 bg-panel p-5 sm:grid-cols-3" onSubmit={submit}>
          <SelectField id="tk-event" label="Event" value={form.eventId} onChange={(event) => update("eventId", event.target.value)}>
            {events.map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </SelectField>
          <SelectField id="tk-type" label="Ticket type" value={form.tier} onChange={(event) => update("tier", event.target.value)}>
            <option value="">Choose a ticket type</option>
            {(form.tier && !ticketTypes.includes(form.tier) ? [form.tier, ...ticketTypes] : ticketTypes).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </SelectField>
          <TextField id="tk-price" label="Price (USD)" type="number" value={form.price} onChange={(event) => update("price", event.target.value)} />
          <TextField id="tk-qty" label="Quantity" type="number" value={form.quantity} onChange={(event) => update("quantity", event.target.value)} />
          <TextField id="tk-start" label="Sales start" type="date" value={form.salesStart} onChange={(event) => update("salesStart", event.target.value)} />
          <TextField id="tk-end" label="Sales end" type="date" value={form.salesEnd} onChange={(event) => update("salesEnd", event.target.value)} />
          <div className="flex flex-wrap gap-2 sm:col-span-3">
            <Button type="submit">{editing ? "Save and resubmit" : "Submit for approval"}</Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={() => { setEditing(""); setForm({ ...blankTicket, eventId: events[0] ? String(events[0].id) : "" }) }}>
                Clear
              </Button>
            )}
          </div>
        </form>
      )}
      <DataTable
        columns={["Event", "Ticket type", "Price", "Quantity", "Window", "Status", ""]}
        rows={rows}
        empty={ready ? "No tickets yet." : ""}
        render={(row) => (
          <>
            <Td className="text-white">{row.event}</Td>
            <Td>{row.tier}</Td>
            <Td>{money(row.price)}</Td>
            <Td>{row.quantity}</Td>
            <Td>{row.salesStart || "—"} → {row.salesEnd || "—"}</Td>
            <Td>
              <StatusBadge status={row.status} />
              {row.status === "Rejected" && row.rejectionReason && (
                <p className="mt-1 max-w-[220px] text-xs text-rose-200">{row.rejectionReason}</p>
              )}
            </Td>
            <Td>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(row.id)
                    setForm({
                      eventId: String(row.eventId),
                      tier: row.tier,
                      price: String(row.price),
                      quantity: String(row.quantity),
                      salesStart: row.salesStart || "",
                      salesEnd: row.salesEnd || "",
                    })
                  }}
                >
                  {row.status === "Rejected" ? "Correct and resubmit" : "Edit"}
                </Button>
                <Button variant="danger" onClick={() => remove(row)}>Delete</Button>
              </div>
            </Td>
          </>
        )}
      />
    </section>
  )
}

export function OrganizerOrders() {
  useTitle("Organizer orders")
  const { notify } = useAppState()
  const { rows, setRows, ready } = useDeskRows("/api/orders", "orders")

  async function confirm(row) {
    try {
      const data = await api(`/api/orders/${row.recordId}`, { method: "PATCH", body: { status: "Confirmed" } })
      setRows((current) => current.map((item) => (item.recordId === row.recordId ? data.order : item)))
      notify("Order confirmed.")
    } catch (error) {
      notify(error.message)
    }
  }

  return (
    <section>
      <PageIntro title="Ticket orders" text="Bookings for your own events. Confirm a reservation so the buyer knows the seats are held. Platform-wide orders stay on the admin desk." />
      <DataTable
        columns={["Order", "Buyer", "Tickets", "Total", "Status", ""]}
        rows={rows}
        empty={ready ? "No orders yet." : ""}
        render={(row) => (
          <>
            <Td className="text-white">
              <p className="font-medium">{row.event}</p>
              <p className="text-xs text-zinc-500">{row.id} · {row.date}</p>
            </Td>
            <Td>
              <p>{row.buyer}</p>
              <p className="text-xs text-zinc-500">{row.email}</p>
            </Td>
            <Td>{row.qty} × {row.tier}</Td>
            <Td>{money(row.total)}</Td>
            <Td><StatusBadge status={row.status} /></Td>
            <Td>
              {row.status === "Pending" || row.status === "Paid" ? (
                <Button onClick={() => confirm(row)}>Confirm</Button>
              ) : null}
            </Td>
          </>
        )}
      />
    </section>
  )
}

export function OrganizerEnquiries() {
  useTitle("Feedback")
  const { rows, ready } = useDeskRows("/api/reviews", "reviews")

  return (
    <section>
      <PageIntro title="Feedback" text="Notes members leave about events, workshops, and courses. The admin desk sees the same list." />
      <DataTable
        columns={["From", "About", "Kind", "Rating", "Note"]}
        rows={rows}
        empty={ready ? "No feedback yet." : ""}
        render={(row) => (
          <>
            <Td className="font-medium text-white">{row.from || "Member"}</Td>
            <Td>{row.target}</Td>
            <Td>{row.kind}</Td>
            <Td>{row.rating || "—"}</Td>
            <Td>{row.text}</Td>
          </>
        )}
      />
    </section>
  )
}

const bookingColors = {
  Confirmed: "#b42334",
  Paid: "#e11d48",
  Pending: "#f6c9cb",
  "Refund requested": "#7a1220",
  Cancelled: "#a8a29e",
}

function salesByShow(events, orders) {
  const titles = []
  events.forEach((event) => {
    if (event.title && !titles.includes(event.title)) titles.push(event.title)
  })
  orders.forEach((order) => {
    if (order.event && !titles.includes(order.event)) titles.push(order.event)
  })
  return titles.map((title) => ({
    label: title,
    value: orders
      .filter((order) => order.event === title && (order.status === "Paid" || order.status === "Confirmed"))
      .reduce((sum, order) => sum + Number(order.total || 0), 0),
  }))
}

function revenueByMonth(orders) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    return {
      label: date.toLocaleString("en", { month: "short" }),
      value: orders
        .filter((order) => (order.status === "Paid" || order.status === "Confirmed") && String(order.date || "").startsWith(key))
        .reduce((sum, order) => sum + Number(order.total || 0), 0),
    }
  })
}

function bookingStatus(orders) {
  const counts = new Map()
  orders.forEach((order) => counts.set(order.status, (counts.get(order.status) || 0) + 1))
  return [...counts.entries()].map(([label, value]) => ({
    label,
    value,
    color: bookingColors[label] || "#e7a4a8",
  }))
}

export function OrganizerReports() {
  useTitle("Organizer reports")
  const { rows: events, ready: eventsReady } = useDeskRows("/api/events", "events")
  const { rows: orders, ready: ordersReady } = useDeskRows("/api/orders", "orders")
  const ready = eventsReady && ordersReady
  const paid = orders.filter((row) => row.status === "Paid" || row.status === "Confirmed")
  const sales = paid.reduce((sum, row) => sum + row.total, 0)
  const showSales = salesByShow(events, orders)
  const revenue = revenueByMonth(orders)
  const statuses = bookingStatus(orders)

  return (
    <section>
      <PageIntro title="Reports" text="Ticket sales and bookings for your events, with charts for revenue, sales by show, and booking status." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Sales" value={ready ? money(sales) : "—"} detail={ready ? `${paid.length} confirmed orders` : "Counting orders"} />
        <Stat label="Bookings" value={ready ? orders.length : "—"} detail="Including pending holds" />
        <Stat label="Approved events" value={ready ? events.filter((row) => row.status === "Approved").length : "—"} detail={ready ? `${events.length} submitted` : "Counting shows"} />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <article className="rounded-3xl border border-[#f3d6da] bg-raised p-5 shadow-sm">
          <h2 className="font-display text-xl text-white">Ticket revenue</h2>
          <p className="text-sm text-zinc-500">Confirmed and paid orders over the last six months</p>
          <AreaChart series={revenue} />
          <div className="mt-2 grid grid-cols-6 text-center text-xs text-zinc-500">
            {revenue.map((item) => (
              <span key={item.label}>{item.label}</span>
            ))}
          </div>
        </article>
        <article className="rounded-3xl border border-[#f3d6da] bg-raised p-5 shadow-sm">
          <h2 className="font-display text-xl text-white">Booking status</h2>
          {!ready || statuses.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-400">{ready ? "No bookings yet." : ""}</p>
          ) : (
            <div className="mt-4 flex items-center gap-4">
              <DonutChart slices={statuses} label="Bookings by status" center="orders" />
              <ul className="space-y-2 text-sm">
                {statuses.map((slice) => (
                  <li key={slice.label} className="flex items-center gap-2 text-zinc-300">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
                    {slice.label}
                    <span className="text-zinc-500">{slice.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </div>
      <article className="mt-4 rounded-3xl border border-[#f3d6da] bg-raised p-5 shadow-sm">
        <h2 className="font-display text-xl text-white">Sales by show</h2>
        <p className="text-sm text-zinc-500">Confirmed and paid totals for each event</p>
        {!ready || showSales.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-400">{ready ? "No events to chart yet." : ""}</p>
        ) : (
          <>
            <BarChart series={showSales} />
            <div className="mt-2 grid text-center text-xs text-zinc-500" style={{ gridTemplateColumns: `repeat(${showSales.length}, minmax(0, 1fr))` }}>
              {showSales.map((item) => (
                <span key={item.label} className="truncate px-1" title={`${item.label} ${money(item.value)}`}>
                  {item.label}
                  <span className="mt-0.5 block text-zinc-400">{money(item.value)}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </article>
      <div className="mt-6">
        <DataTable
          columns={["Event", "Status", "From price", "When"]}
          rows={events}
          empty={ready ? "No events to report." : ""}
          render={(row) => (
            <>
              <Td className="font-medium text-white">{row.title}</Td>
              <Td><StatusBadge status={row.status} /></Td>
              <Td>{money(row.price)}</Td>
              <Td>{row.date}</Td>
            </>
          )}
        />
      </div>
    </section>
  )
}
