import { useState } from "react"
import ResourceScreen, { Cell, StatusBadge } from "../../components/admin/ResourceScreen"
import { AreaChart } from "../../components/admin/Charts"
import Button from "../../components/ui/Button"
import { TextField } from "../../components/ui/Field"
import { activity, enrollments, orders, revenueSeries, workshops } from "../../data/content"
import { sampleReviews } from "../../data/desk"
import { useAppState } from "../../context/AppState"
import { money } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

const complaints = [
  ...sampleReviews,
  { id: "RV-3", target: "Community post", kind: "Complaint", rating: 1, text: "Reported a comment for harassment.", date: "2026-10-11" },
]

export function ManageFeedback() {
  useTitle("Feedback")
  return (
    <ResourceScreen
      title="Feedback and reviews"
      description="Reviews for events, workshops, and courses, plus complaints. Removing a row hides it from this preview."
      createLabel="Add note"
      seed={complaints}
      searchKeys={["target", "kind", "text"]}
      filters={[
        { key: "kind", label: "Kinds", options: ["Event", "Workshop", "Course", "Complaint"] },
      ]}
      columns={["About", "Kind", "Rating", "Note", ""]}
      fields={[
        { name: "target", label: "About" },
        { name: "kind", label: "Kind", type: "select", options: ["Event", "Workshop", "Course", "Complaint"] },
        { name: "rating", label: "Rating", type: "number" },
        { name: "text", label: "Note", type: "textarea" },
      ]}
      renderCells={(row) => (
        <>
          <Cell className="font-medium text-white">{row.target}</Cell>
          <Cell>{row.kind}</Cell>
          <Cell>{row.rating || "—"}</Cell>
          <Cell>{row.text}</Cell>
        </>
      )}
      detail={(row) => [
        ["About", row.target],
        ["Kind", row.kind],
        ["Rating", String(row.rating || "—")],
        ["Note", row.text],
        ["Date", row.date],
      ]}
    />
  )
}

export function ManageReports() {
  useTitle("Reports")
  const paid = orders.filter((order) => order.status === "Paid")
  const sales = paid.reduce((sum, order) => sum + order.total, 0)
  const seats = paid.reduce((sum, order) => sum + order.qty, 0)

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Studio</p>
      <h1 className="mt-1 font-display text-3xl text-white">Reports</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        Ticket sales, attendance, workshop registrations, course enrollments, and recent user activity. Figures are sample numbers for this design.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Ticket sales", money(sales)],
          ["Seats sold", String(seats)],
          ["Workshop registrations", String(workshops.length)],
          ["Course enrollments", String(enrollments.length)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-white/10 bg-panel p-4">
            <p className="text-sm text-zinc-400">{label}</p>
            <p className="mt-2 font-display text-3xl text-white">{value}</p>
          </article>
        ))}
      </div>
      <article className="mt-4 rounded-2xl border border-white/10 bg-panel p-5">
        <h2 className="font-display text-xl text-white">Ticket revenue</h2>
        <AreaChart series={revenueSeries} />
      </article>
      <article className="mt-4 rounded-2xl border border-white/10 bg-panel p-5">
        <h2 className="font-display text-xl text-white">User activity</h2>
        <ul className="mt-4 divide-y divide-white/8">
          {activity.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 py-3 text-sm">
              <span className="text-zinc-200">{item.text}</span>
              <span className="shrink-0 text-zinc-500">{item.time}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  )
}

const categorySeed = [
  { id: "CAT-1", name: "Piano", courses: 2, status: "Active" },
  { id: "CAT-2", name: "Vocal", courses: 1, status: "Active" },
  { id: "CAT-3", name: "Guitar", courses: 1, status: "Active" },
  { id: "CAT-4", name: "Drums", courses: 1, status: "Active" },
]

export function ManageCategories() {
  useTitle("Course categories")
  return (
    <ResourceScreen
      title="Course categories"
      description="Piano, vocal, guitar, and drums. New categories stay in this preview."
      createLabel="Add category"
      seed={categorySeed}
      searchKeys={["name"]}
      filters={[{ key: "status", label: "Statuses", options: ["Active", "Hidden"] }]}
      columns={["Category", "Courses", "Status", ""]}
      fields={[
        { name: "name", label: "Name" },
        { name: "courses", label: "Listed courses", type: "number" },
        { name: "status", label: "Status", type: "select", options: ["Active", "Hidden"] },
      ]}
      renderCells={(row) => (
        <>
          <Cell className="font-medium text-white">{row.name}</Cell>
          <Cell>{row.courses}</Cell>
          <Cell>
            <StatusBadge status={row.status} />
          </Cell>
        </>
      )}
      detail={(row) => [
        ["Category", row.name],
        ["Courses", String(row.courses)],
        ["Status", row.status],
      ]}
    />
  )
}

export function AdminProfile() {
  useTitle("Admin profile")
  const { user, setUser, notify } = useAppState()
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    city: user?.city || "",
  })

  function save(event) {
    event.preventDefault()
    setUser((current) => (current ? { ...current, ...form } : current))
    notify("Admin profile updated on this page.")
  }

  return (
    <section>
      <h1 className="font-display text-3xl text-white">Admin profile</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        {user?.email}. This desk manages users, organizers, events, tickets, workshops, courses, and community content.
      </p>
      <form className="mt-6 max-w-lg space-y-4 rounded-3xl border border-white/10 bg-panel p-5" onSubmit={save}>
        <TextField id="admin-name" label="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        <TextField id="admin-email" label="Email" value={user?.email || ""} readOnly />
        <TextField id="admin-phone" label="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
        <TextField id="admin-city" label="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
        <Button type="submit">Save profile</Button>
      </form>
    </section>
  )
}
