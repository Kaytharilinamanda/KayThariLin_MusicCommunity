import { useState } from "react"
import {
  BadgeDollarSign,
  CalendarDays,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Ticket,
  Users,
  UserRound,
  BarChart3,
  Undo2,
  Image,
} from "lucide-react"
import StudioShell from "../../components/layout/StudioShell"
import Button from "../../components/ui/Button"
import { DataTable, Stat, Td } from "../../components/ui/DataTable"
import { StatusBadge } from "../../components/admin/ResourceScreen"
import { TextArea, TextField } from "../../components/ui/Field"
import { useAppState } from "../../context/AppState"
import {
  organizerAds,
  organizerAnnouncements,
  organizerEnquiries,
  organizerEvents,
  organizerOrders,
  organizerRefunds,
  organizerTickets,
} from "../../data/desk"
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
    label: "Box office",
    items: [
      { to: "/organizer/orders", label: "Orders", icon: BadgeDollarSign },
      { to: "/organizer/attendees", label: "Attendees", icon: Users },
      { to: "/organizer/refunds", label: "Refunds", icon: Undo2 },
      { to: "/organizer/enquiries", label: "Enquiries", icon: MessageSquare },
    ],
  },
  {
    label: "Insights",
    items: [{ to: "/organizer/reports", label: "Reports", icon: BarChart3 }],
  },
]

const notes = [
  { id: "o1", title: "New ticket order", detail: "One Night · 2 seats", time: "18m" },
  { id: "o2", title: "Enquiry waiting", detail: "Seating question on the floor plan", time: "3h" },
  { id: "o3", title: "Refund requested", detail: "Order pending your review", time: "1d" },
]

function useSessionList(key, seed) {
  const [rows, setRows] = useState(() => {
    try {
      const saved = sessionStorage.getItem(key)
      return saved ? JSON.parse(saved) : seed
    } catch {
      return seed
    }
  })
  function update(next) {
    setRows((current) => {
      const value = typeof next === "function" ? next(current) : next
      sessionStorage.setItem(key, JSON.stringify(value))
      return value
    })
  }
  return [rows, update]
}

export function OrganizerLayout() {
  const { user } = useAppState()

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
            Your organizer registration is waiting for the studio admin. You can prepare events here. Publishing stays on this design page until the account is approved.
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
  const [events] = useSessionList("harmony-org-events", organizerEvents)
  const [orders] = useSessionList("harmony-org-orders", organizerOrders)
  const sold = orders.filter((row) => row.status === "Paid").reduce((sum, row) => sum + row.total, 0)
  const seats = orders.reduce((sum, row) => sum + row.qty, 0)
  return (
    <section>
      <PageIntro title="Your shows" text="Ticket sales, bookings, and attendance for the events on this organizer account." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Events" value={events.length} detail={`${events.filter((row) => row.status === "Published").length} published`} />
        <Stat label="Ticket sales" value={money(sold)} detail="Paid orders in this preview" />
        <Stat label="Seats booked" value={seats} detail="Across your sample orders" />
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

  function save(event) {
    event.preventDefault()
    setUser((current) => (current ? { ...current, ...form } : current))
    notify("Organizer profile updated on this page.")
  }

  return (
    <section>
      <PageIntro title="Organizer profile" text={`Status: ${statusLabel(user?.status)}. Contact details on this form stay in the browser.`} />
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
  city: "Yangon",
  venue: "",
  date: "",
  time: "7:00 PM",
  price: "",
  quantity: "",
  salesStart: "",
  salesEnd: "",
}

export function OrganizerEvents() {
  useTitle("Organizer events")
  const { notify } = useAppState()
  const [events, setEvents] = useSessionList("harmony-org-events", organizerEvents)
  const [form, setForm] = useState(blankEvent)
  const [editing, setEditing] = useState("")

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function save(event) {
    event.preventDefault()
    if (!form.title.trim() || !form.artist.trim() || !form.venue.trim() || !form.date) {
      notify("Add a title, artist, venue, and date.")
      return
    }
    const row = {
      ...form,
      price: Number(form.price) || 0,
      quantity: Number(form.quantity) || 0,
      status: "Pending approval",
    }
    if (editing) {
      setEvents((current) => current.map((item) => (item.id === editing ? { ...item, ...row, id: editing } : item)))
      notify("Event updated and marked pending approval on this page.")
    } else {
      setEvents((current) => [{ ...row, id: `OE-${Date.now().toString().slice(-6)}` }, ...current])
      notify("Event submitted for admin approval on this page.")
    }
    setForm(blankEvent)
    setEditing("")
  }

  return (
    <section>
      <PageIntro
        title="Events"
        text="Create and edit your own shows. Saving marks the event pending approval. These rows stay in this browser. The admin events desk is the review screen."
      />
      <form className="mb-6 grid gap-4 rounded-3xl border border-white/10 bg-panel p-5 sm:grid-cols-2" onSubmit={save}>
        <TextField id="ev-title" label="Title" value={form.title} onChange={(event) => update("title", event.target.value)} />
        <TextField id="ev-artist" label="Artist" value={form.artist} onChange={(event) => update("artist", event.target.value)} />
        <TextField id="ev-city" label="City" value={form.city} onChange={(event) => update("city", event.target.value)} />
        <TextField id="ev-venue" label="Venue" value={form.venue} onChange={(event) => update("venue", event.target.value)} />
        <TextField id="ev-date" label="Date" type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
        <TextField id="ev-time" label="Time" value={form.time} onChange={(event) => update("time", event.target.value)} />
        <TextField id="ev-price" label="From price (USD)" type="number" value={form.price} onChange={(event) => update("price", event.target.value)} />
        <TextField id="ev-qty" label="Ticket quantity" type="number" value={form.quantity} onChange={(event) => update("quantity", event.target.value)} />
        <TextField id="ev-start" label="Sales start" type="date" value={form.salesStart} onChange={(event) => update("salesStart", event.target.value)} />
        <TextField id="ev-end" label="Sales end" type="date" value={form.salesEnd} onChange={(event) => update("salesEnd", event.target.value)} />
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
        columns={["Show", "When", "Venue", "Tickets", "Status", ""]}
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
            <Td>{money(row.price)} · {row.quantity}</Td>
            <Td><StatusBadge status={row.status} /></Td>
            <Td>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(row.id)
                  setForm({ ...row, price: String(row.price), quantity: String(row.quantity) })
                }}
              >
                Edit
              </Button>
            </Td>
          </>
        )}
      />
    </section>
  )
}

function noticePage({ title, text, storageKey, seed, noun }) {
  return function NoticePage() {
    useTitle(title)
    const { notify } = useAppState()
    const [rows, setRows] = useSessionList(storageKey, seed)
    const [form, setForm] = useState({ title: "", event: "One Night", extra: "" })

    function submit(event) {
      event.preventDefault()
      if (form.title.trim().length < 3) {
        notify(`Add a title for the ${noun}.`)
        return
      }
      setRows((current) => [
        {
          id: `${noun.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-5)}`,
          title: form.title.trim(),
          event: form.event,
          audience: form.extra || "Ticket holders",
          placement: form.extra || "Event page",
          status: "Published",
          date: new Date().toISOString().slice(0, 10),
        },
        ...current,
      ])
      setForm({ title: "", event: "One Night", extra: "" })
      notify(`${title} saved on this page.`)
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
  text: "Notes for people who already hold tickets. New announcements are published on this design page.",
  storageKey: "harmony-org-notes",
  seed: organizerAnnouncements,
  noun: "announcement",
})

export const OrganizerAds = noticePage({
  title: "Advertisements",
  text: "Promotional spots for your own events. The admin desk can still review them on the design screens.",
  storageKey: "harmony-org-ads",
  seed: organizerAds,
  noun: "ad",
})

export function OrganizerTicketSetup() {
  useTitle("Ticket setup")
  const { notify } = useAppState()
  const [rows, setRows] = useSessionList("harmony-org-tickets", organizerTickets)
  const [form, setForm] = useState({ event: "One Night", tier: "", price: "", quantity: "", salesStart: "", salesEnd: "" })

  function submit(event) {
    event.preventDefault()
    if (!form.tier.trim()) {
      notify("Name the ticket tier.")
      return
    }
    setRows((current) => [
      {
        id: `TK-${Date.now().toString().slice(-5)}`,
        event: form.event,
        tier: form.tier,
        price: Number(form.price) || 0,
        quantity: Number(form.quantity) || 0,
        sold: 0,
        salesStart: form.salesStart,
        salesEnd: form.salesEnd,
        status: "On sale",
      },
      ...current,
    ])
    setForm({ event: "One Night", tier: "", price: "", quantity: "", salesStart: "", salesEnd: "" })
    notify("Ticket tier saved on this page.")
  }

  return (
    <section>
      <PageIntro title="Tickets" text="Set prices, quantities, and the sales window for your own events. Availability updates stay in this browser." />
      <form className="mb-6 grid gap-4 rounded-3xl border border-white/10 bg-panel p-5 sm:grid-cols-3" onSubmit={submit}>
        <TextField id="tk-event" label="Event" value={form.event} onChange={(event) => setForm((current) => ({ ...current, event: event.target.value }))} />
        <TextField id="tk-tier" label="Tier" value={form.tier} onChange={(event) => setForm((current) => ({ ...current, tier: event.target.value }))} />
        <TextField id="tk-price" label="Price (USD)" type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} />
        <TextField id="tk-qty" label="Quantity" type="number" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} />
        <TextField id="tk-start" label="Sales start" type="date" value={form.salesStart} onChange={(event) => setForm((current) => ({ ...current, salesStart: event.target.value }))} />
        <TextField id="tk-end" label="Sales end" type="date" value={form.salesEnd} onChange={(event) => setForm((current) => ({ ...current, salesEnd: event.target.value }))} />
        <div className="sm:col-span-3">
          <Button type="submit">Add ticket tier</Button>
        </div>
      </form>
      <DataTable
        columns={["Event", "Tier", "Price", "Sold", "Window", "Status", ""]}
        rows={rows}
        empty="No ticket tiers yet."
        render={(row) => (
          <>
            <Td className="text-white">{row.event}</Td>
            <Td>{row.tier}</Td>
            <Td>{money(row.price)}</Td>
            <Td>{row.sold} / {row.quantity}</Td>
            <Td>{row.salesStart || "—"} → {row.salesEnd || "—"}</Td>
            <Td><StatusBadge status={row.status} /></Td>
            <Td>
              <Button
                variant="secondary"
                onClick={() => {
                  const next = row.status === "On sale" ? "Held" : "On sale"
                  setRows((current) => current.map((item) => (item.id === row.id ? { ...item, status: next } : item)))
                }}
              >
                {row.status === "On sale" ? "Hold sales" : "Put on sale"}
              </Button>
            </Td>
          </>
        )}
      />
    </section>
  )
}

export function OrganizerOrders() {
  useTitle("Organizer orders")
  const [rows] = useSessionList("harmony-org-orders", organizerOrders)
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

export function OrganizerAttendees() {
  useTitle("Attendees")
  const [rows] = useSessionList("harmony-org-orders", organizerOrders)
  const people = rows.filter((row) => row.status === "Paid")
  return (
    <section>
      <PageIntro title="Attendees" text="Paid ticket holders for your events, with a sales count beside each name." />
      <DataTable
        columns={["Name", "Event", "Tickets", "Total"]}
        rows={people}
        empty="No paid attendees yet."
        render={(row) => (
          <>
            <Td className="font-medium text-white">{row.buyer}</Td>
            <Td>{row.event}</Td>
            <Td>{row.qty} × {row.tier}</Td>
            <Td>{money(row.total)}</Td>
          </>
        )}
      />
    </section>
  )
}

export function OrganizerRefunds() {
  useTitle("Refunds")
  const { notify } = useAppState()
  const [rows, setRows] = useSessionList("harmony-org-refunds", organizerRefunds)

  function respond(id, status) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)))
    notify(status === "Refunded" ? "Refund marked complete on this page." : "Refund request declined on this page.")
  }

  return (
    <section>
      <PageIntro title="Cancellations and refunds" text="Requests from ticket holders on your events. Replies stay in this browser." />
      <DataTable
        columns={["Request", "Buyer", "Amount", "Status", ""]}
        rows={rows}
        empty="No refund requests."
        render={(row) => (
          <>
            <Td className="text-white">
              <p className="font-medium">{row.event}</p>
              <p className="text-xs text-zinc-500">{row.order} · {row.reason}</p>
            </Td>
            <Td>{row.buyer}</Td>
            <Td>{money(row.amount)}</Td>
            <Td><StatusBadge status={row.status} /></Td>
            <Td>
              {row.status === "Open" && (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => respond(row.id, "Refunded")}>Refund</Button>
                  <Button variant="ghost" onClick={() => respond(row.id, "Declined")}>Decline</Button>
                </div>
              )}
            </Td>
          </>
        )}
      />
    </section>
  )
}

export function OrganizerEnquiries() {
  useTitle("Enquiries")
  const { notify } = useAppState()
  const [rows, setRows] = useSessionList("harmony-org-questions", organizerEnquiries)
  const [reply, setReply] = useState("")
  const [active, setActive] = useState(rows[0]?.id || "")

  function send(event) {
    event.preventDefault()
    if (!active || reply.trim().length < 2) {
      notify("Write a reply first.")
      return
    }
    setRows((current) => current.map((row) => (row.id === active ? { ...row, reply: reply.trim(), status: "Replied" } : row)))
    setReply("")
    notify("Reply saved on this page.")
  }

  return (
    <section>
      <PageIntro title="Enquiries and feedback" text="Questions about your events. Pick one and send a reply." />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <DataTable
          columns={["From", "Event", "Message", "Status"]}
          rows={rows}
          empty="No enquiries."
          render={(row) => (
            <>
              <Td className="font-medium text-white">{row.from}</Td>
              <Td>{row.event}</Td>
              <Td>{row.reply ? `${row.message} — ${row.reply}` : row.message}</Td>
              <Td><StatusBadge status={row.status === "Replied" ? "Confirmed" : row.status} /></Td>
            </>
          )}
        />
        <form className="h-fit space-y-4 rounded-3xl border border-white/10 bg-panel p-5" onSubmit={send}>
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-zinc-200">Reply to</span>
            <select className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white" value={active} onChange={(event) => setActive(event.target.value)}>
              {rows.map((row) => (
                <option key={row.id} value={row.id}>{row.from} · {row.event}</option>
              ))}
            </select>
          </label>
          <TextArea id="org-reply" label="Reply" value={reply} onChange={(event) => setReply(event.target.value)} />
          <Button type="submit">Send reply</Button>
        </form>
      </div>
    </section>
  )
}

export function OrganizerReports() {
  useTitle("Organizer reports")
  const [events] = useSessionList("harmony-org-events", organizerEvents)
  const [orders] = useSessionList("harmony-org-orders", organizerOrders)
  const paid = orders.filter((row) => row.status === "Paid")
  const sales = paid.reduce((sum, row) => sum + row.total, 0)
  const seats = paid.reduce((sum, row) => sum + row.qty, 0)
  return (
    <section>
      <PageIntro title="Reports" text="Ticket sales, bookings, and attendance for your own events." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Sales" value={money(sales)} detail={`${paid.length} paid orders`} />
        <Stat label="Bookings" value={orders.length} detail="Including pending holds" />
        <Stat label="Attendance" value={seats} detail={`${events.length} events on this desk`} />
      </div>
      <div className="mt-6">
        <DataTable
          columns={["Event", "Status", "From price", "Quantity"]}
          rows={events}
          empty="No events to report."
          render={(row) => (
            <>
              <Td className="font-medium text-white">{row.title}</Td>
              <Td><StatusBadge status={row.status} /></Td>
              <Td>{money(row.price)}</Td>
              <Td>{row.quantity}</Td>
            </>
          )}
        />
      </div>
    </section>
  )
}
