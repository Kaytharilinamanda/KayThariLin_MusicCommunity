import { useEffect, useState } from "react"
import {
  BadgeDollarSign,
  Building2,
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
import { StatusBadge } from "../../components/admin/ResourceScreen"
import { SelectField, TextArea, TextField } from "../../components/ui/Field"
import { useAppState } from "../../context/AppState"
import { categories } from "../../data/content"
import { api } from "../../lib/api"
import { money } from "../../lib/format"
import { statusLabel } from "../../lib/account"
import { useTitle } from "../../lib/useTitle"

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
      { to: "/organizer/ads", label: "Advertisements", icon: Image },
      { to: "/organizer/tickets", label: "Tickets", icon: Ticket },
    ],
  },
  {
    label: "Programs",
    items: [
      { to: "/organizer/workshops", label: "Workshops", icon: Drum },
      { to: "/organizer/courses", label: "Courses", icon: GraduationCap },
      { to: "/organizer/categories", label: "Course categories", icon: Tags },
      { to: "/organizer/centers", label: "Music centers", icon: Building2 },
      { to: "/organizer/enrollments", label: "Enrollments", icon: ClipboardList },
    ],
  },
  {
    label: "Box office",
    items: [
      { to: "/organizer/orders", label: "Orders", icon: BadgeDollarSign },
      { to: "/organizer/enquiries", label: "Enquiries", icon: MessageSquare },
    ],
  },
  {
    label: "Insights",
    items: [{ to: "/organizer/reports", label: "Reports", icon: BarChart3 }],
  },
]

export function OrganizerLayout() {
  const { user } = useAppState()
  const [notes, setNotes] = useState([])

  useEffect(() => {
    api("/api/notifications").then((data) => setNotes(data.notifications || [])).catch(() => setNotes([]))
  }, [])

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
  const [events, setEvents] = useState([])
  const [orders, setOrders] = useState([])
  const sold = orders.filter((row) => row.status === "Paid").reduce((sum, row) => sum + row.total, 0)
  const seats = orders.reduce((sum, row) => sum + row.qty, 0)

  useEffect(() => {
    api("/api/events").then((data) => setEvents(data.events || [])).catch(() => setEvents([]))
    api("/api/orders").then((data) => setOrders(data.orders || [])).catch(() => setOrders([]))
  }, [])

  return (
    <section>
      <PageIntro title="Your shows" text="Ticket sales, bookings, and attendance for the events on this organizer account." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Events" value={events.length} detail={`${events.filter((row) => row.status === "Approved").length} approved`} />
        <Stat label="Ticket sales" value={money(sold)} detail="Paid orders for your events" />
        <Stat label="Seats booked" value={seats} detail="Across stored orders" />
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
      <PageIntro title="Organizer profile" text={`Status: ${statusLabel(user?.status)}. Contact details are saved to your account.`} />
      <form className="max-w-lg space-y-4 rounded-3xl border border-white/10 bg-panel p-5" onSubmit={save}>
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
  blurb: "",
}

export function OrganizerEvents() {
  useTitle("Organizer events")
  const { notify } = useAppState()
  const [events, setEvents] = useState([])
  const [error, setError] = useState("")
  const [form, setForm] = useState(blankEvent)
  const [editing, setEditing] = useState("")

  async function load() {
    try {
      const data = await api("/api/events")
      setEvents(data.events || [])
      setError("")
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save(event) {
    event.preventDefault()
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
        empty="No events yet."
        render={(row) => (
          <>
            <Td className="text-white">
              <p className="font-medium">{row.title}</p>
              <p className="text-xs text-zinc-500">{row.artist}</p>
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
    const [rows, setRows] = useState([])
    const [form, setForm] = useState({ title: "", event: "One Night", extra: "" })
    const kind = noun === "ad" ? "ad" : "announcement"

    useEffect(() => {
      api(`/api/announcements/mine?kind=${kind}`).then((data) => setRows(data.announcements || [])).catch((error) => notify(error.message))
    }, [notify])

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
            kind,
            title: form.title.trim(),
            event: form.event,
            audience: noun === "ad" ? "Ticket holders" : form.extra || "Ticket holders",
            placement: noun === "ad" ? form.extra || "Event page" : "",
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
          <TextField id={`${noun}-extra`} label={noun === "ad" ? "Placement" : "Audience"} value={form.extra} onChange={(event) => setForm((current) => ({ ...current, extra: event.target.value }))} />
          <div className="sm:col-span-2">
            <Button type="submit">Publish</Button>
          </div>
        </form>
        <DataTable
          columns={["Title", "Event", noun === "ad" ? "Placement" : "Audience", "Status"]}
          rows={rows}
          empty={`No ${noun}s yet.`}
          render={(row) => (
            <>
              <Td className="font-medium text-white">{row.title}</Td>
              <Td>{row.event}</Td>
              <Td>{noun === "ad" ? row.placement : row.audience}</Td>
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

export const OrganizerAds = noticePage({
  title: "Advertisements",
  text: "Promotional spots for your own events, stored with your organizer account.",
  noun: "ad",
})

const blankTicket = { eventId: "", tier: "", price: "", quantity: "", salesStart: "", salesEnd: "" }

export function OrganizerTicketSetup() {
  useTitle("Ticket setup")
  const { notify } = useAppState()
  const [events, setEvents] = useState([])
  const [rows, setRows] = useState([])
  const [error, setError] = useState("")
  const [form, setForm] = useState(blankTicket)
  const [editing, setEditing] = useState("")

  async function load() {
    try {
      const [eventData, ticketData] = await Promise.all([api("/api/events"), api("/api/tickets")])
      const nextEvents = eventData.events || []
      setEvents(nextEvents)
      setRows(ticketData.tickets || [])
      setForm((current) => ({ ...current, eventId: current.eventId || (nextEvents[0] ? String(nextEvents[0].id) : "") }))
      setError("")
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

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
        text="Create, edit, and delete ticket tiers for your own events. Saving submits the tier to the admin. You can read Pending, Approved, and Rejected here, then correct a rejection and resubmit."
      />
      {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}
      {events.length === 0 ? (
        <p className="mb-6 rounded-3xl border border-white/10 bg-panel p-5 text-sm text-zinc-400">Submit an event before you add tickets.</p>
      ) : (
        <form className="mb-6 grid gap-4 rounded-3xl border border-white/10 bg-panel p-5 sm:grid-cols-3" onSubmit={submit}>
          <SelectField id="tk-event" label="Event" value={form.eventId} onChange={(event) => update("eventId", event.target.value)}>
            {events.map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </SelectField>
          <TextField id="tk-tier" label="Tier" value={form.tier} onChange={(event) => update("tier", event.target.value)} />
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
        columns={["Event", "Tier", "Price", "Quantity", "Window", "Status", ""]}
        rows={rows}
        empty="No ticket tiers yet."
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
  const [rows, setRows] = useState([])

  useEffect(() => {
    api("/api/orders").then((data) => setRows(data.orders || [])).catch(() => setRows([]))
  }, [])
  return (
    <section>
      <PageIntro title="Ticket orders" text="Bookings for your own events. Platform-wide orders stay on the admin desk." />
      <DataTable
        columns={["Order", "Buyer", "Tickets", "Total", "Status"]}
        rows={rows}
        empty="No orders yet."
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
          </>
        )}
      />
    </section>
  )
}

export function OrganizerEnquiries() {
  useTitle("Enquiries")
  const [rows, setRows] = useState([])

  useEffect(() => {
    api("/api/enquiries").then((data) => setRows(data.enquiries || [])).catch(() => setRows([]))
  }, [])

  return (
    <section>
      <PageIntro title="Enquiries and feedback" text="Questions and feedback about your events. This list is view only." />
      <DataTable
        columns={["From", "Event", "Message", "Status"]}
        rows={rows}
        empty="No enquiries."
        render={(row) => (
          <>
            <Td className="font-medium text-white">{row.from}</Td>
            <Td>{row.event}</Td>
            <Td>{row.message}</Td>
            <Td><StatusBadge status={row.status} /></Td>
          </>
        )}
      />
    </section>
  )
}

export function OrganizerReports() {
  useTitle("Organizer reports")
  const [events, setEvents] = useState([])
  const [orders, setOrders] = useState([])
  const paid = orders.filter((row) => row.status === "Paid")
  const sales = paid.reduce((sum, row) => sum + row.total, 0)

  useEffect(() => {
    api("/api/events").then((data) => setEvents(data.events || [])).catch(() => setEvents([]))
    api("/api/orders").then((data) => setOrders(data.orders || [])).catch(() => setOrders([]))
  }, [])

  return (
    <section>
      <PageIntro title="Reports" text="Ticket sales and bookings for your events, with the approval status of each show." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Sales" value={money(sales)} detail={`${paid.length} paid orders`} />
        <Stat label="Bookings" value={orders.length} detail="Including pending holds" />
        <Stat label="Approved events" value={events.filter((row) => row.status === "Approved").length} detail={`${events.length} submitted`} />
      </div>
      <div className="mt-6">
        <DataTable
          columns={["Event", "Status", "From price", "When"]}
          rows={events}
          empty="No events to report."
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
