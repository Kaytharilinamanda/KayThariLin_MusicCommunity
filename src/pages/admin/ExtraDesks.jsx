import { useEffect, useState } from "react"
import { api } from "../../lib/api"
import ResourceScreen, { Cell, StatusBadge } from "../../components/admin/ResourceScreen"
import ApprovalQueue, { ApprovalStatus } from "../../components/admin/ApprovalQueue"
import { Td } from "../../components/ui/DataTable"
import { AreaChart } from "../../components/admin/Charts"
import Button from "../../components/ui/Button"
import { TextField } from "../../components/ui/Field"
import { useAppState } from "../../context/AppState"
import { money } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

export function ManageFeedback() {
  useTitle("Feedback")
  return (
    <ResourceScreen
      title="Feedback and reviews"
      description="Reviews and enquiries stored by members. This desk reads them."
      createLabel="Add note"
      endpoint="/api/reviews"
      listKey="reviews"
      readOnly
      seed={[]}
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

function downloadReport(report) {
  const lines = [
    "Section,Metric,Value",
    `Accounts,Users,${report.accounts.users}`,
    `Accounts,Active users,${report.accounts.activeUsers}`,
    `Accounts,Organizers,${report.accounts.organizers}`,
    `Accounts,Pending organizers,${report.accounts.pendingOrganizers}`,
    `Accounts,Admins,${report.admins}`,
    `Events,Pending,${report.events.pending}`,
    `Events,Approved,${report.events.approved}`,
    `Events,Rejected,${report.events.rejected}`,
    `Tickets,Pending,${report.tickets.pending}`,
    `Tickets,Approved,${report.tickets.approved}`,
    `Tickets,Rejected,${report.tickets.rejected}`,
    ...report.waiting.map((row) => `Waiting,${row.kind}: ${row.title},${row.owner}`),
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "harmony-analysis.csv"
  link.click()
  URL.revokeObjectURL(url)
}

export function ManageReports() {
  useTitle("Reports")
  const { notify } = useAppState()
  const [report, setReport] = useState(null)
  const [busy, setBusy] = useState(false)
  const [dash, setDash] = useState({ sales: 0, seats: 0, registrations: 0, enrollments: 0, revenueSeries: [], activity: [] })

  useEffect(() => {
    api("/api/dashboard").then((data) => setDash(data.dashboard || {})).catch(() => {})
  }, [])

  const sales = dash.sales || 0
  const seats = dash.seats || 0
  const revenueSeries = dash.revenueSeries?.length ? dash.revenueSeries : [{ label: "—", value: 0 }, { label: "—", value: 0 }]
  const activity = dash.activity || []

  async function generate() {
    setBusy(true)
    try {
      const data = await api("/api/reports")
      setReport(data.report)
      notify("Analysis report generated.")
    } catch (error) {
      notify(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Studio</p>
      <h1 className="mt-1 font-display text-3xl text-white">Reports</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        Generate an analysis of accounts, event approvals, and ticket approvals. Sales figures come from stored orders.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={generate} disabled={busy}>{busy ? "Generating…" : "Generate report"}</Button>
        {report && (
          <Button variant="secondary" onClick={() => downloadReport(report)}>Download CSV</Button>
        )}
      </div>
      {report && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Users", String(report.accounts.users), `${report.accounts.activeUsers} active`],
              ["Organizers", String(report.accounts.organizers), `${report.accounts.pendingOrganizers} pending`],
              ["Events", String(report.events.approved), `${report.events.pending} pending · ${report.events.rejected} rejected`],
              ["Tickets", String(report.tickets.approved), `${report.tickets.pending} pending · ${report.tickets.rejected} rejected`],
            ].map(([label, value, note]) => (
              <article key={label} className="rounded-2xl border border-white/10 bg-panel p-4">
                <p className="text-sm text-zinc-400">{label}</p>
                <p className="mt-2 font-display text-3xl text-white">{value}</p>
                <p className="mt-1 text-xs text-zinc-500">{note}</p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">Generated {new Date(report.generatedAt).toLocaleString()} · {report.admins} admin account</p>
          <article className="mt-4 rounded-2xl border border-white/10 bg-panel p-5">
            <h2 className="font-display text-xl text-white">Waiting for review</h2>
            {report.waiting.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-400">No events or tickets are pending.</p>
            ) : (
              <ul className="mt-4 divide-y divide-white/8">
                {report.waiting.map((item) => (
                  <li key={`${item.kind}-${item.title}`} className="flex items-start justify-between gap-4 py-3 text-sm">
                    <span className="text-zinc-200">{item.kind} · {item.title}</span>
                    <span className="shrink-0 text-zinc-500">{item.owner}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Ticket sales", money(sales)],
          ["Seats sold", String(seats)],
          ["Workshop registrations", String(dash.registrations || 0)],
          ["Course enrollments", String(dash.enrollments || 0)],
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

export function ManageCategories() {
  useTitle("Review course categories")
  return (
    <ApprovalQueue
      title="Course categories"
      description="Approve or reject categories submitted by organizers. This desk does not create, edit, or delete categories."
      listKey="items"
      reviewBase="/api/programs/categories"
      searchKeys={["name", "organizer"]}
      columns={["Category", "Organizer", "Courses", "Status", ""]}
      renderCells={(row) => (
        <>
          <Td className="font-medium text-white">{row.name}</Td>
          <Td>{row.organizer}</Td>
          <Td>{row.courses}</Td>
          <ApprovalStatus row={row} />
        </>
      )}
      detail={(row) => [
        ["Category", row.name],
        ["Organizer", row.organizer],
        ["Courses", String(row.courses ?? "")],
        ["Status", row.status],
        ["Rejection reason", row.rejectionReason],
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

  async function save(event) {
    event.preventDefault()
    try {
      const data = await api("/api/me", { method: "PATCH", body: form })
      setUser(data.user)
      notify("Admin profile saved.")
    } catch (error) {
      notify(error.message)
    }
  }

  return (
    <section>
      <h1 className="font-display text-3xl text-white">Admin profile</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        {user?.email}. This desk approves organizer submissions and manages user and organizer accounts.
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
