import { useEffect, useState } from "react"
import { ArrowUpRight, Building2, CalendarDays, ClipboardList, GraduationCap, Megaphone, MessageSquare, Star, Ticket, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { AreaChart, DonutChart } from "../../components/admin/Charts"
import { StatusBadge } from "../../components/admin/ResourceScreen"
import { useAppState } from "../../context/AppState"
import { api } from "../../lib/api"
import { money } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

const shortcuts = [
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Organizers", to: "/admin/organizers", icon: Users },
  { label: "Events", to: "/admin/events", icon: CalendarDays },
  { label: "Tickets", to: "/admin/tickets", icon: Ticket },
  { label: "Workshops", to: "/admin/workshops", icon: ClipboardList },
  { label: "Courses", to: "/admin/courses", icon: GraduationCap },
  { label: "Centers", to: "/admin/centers", icon: Building2 },
  { label: "Posts", to: "/admin/posts", icon: MessageSquare },
  { label: "Announcements", to: "/admin/announcements", icon: Megaphone },
  { label: "Feedback", to: "/admin/feedback", icon: Star },
]

const emptyDash = {
  sales: 0,
  seats: 0,
  orders: 0,
  events: 0,
  pendingEvents: 0,
  workshops: 0,
  enrollments: 0,
  accounts: 0,
  announcements: 0,
  revenueSeries: [],
  genreSplit: [],
  waiting: [],
  activity: [],
  ordersList: [],
}

export default function Dashboard() {
  useTitle("Admin dashboard")
  const { user } = useAppState()
  const [dash, setDash] = useState(emptyDash)

  useEffect(() => {
    api("/api/dashboard")
      .then((data) => {
        const payload = data.dashboard || {}
        const recent = Array.isArray(payload.ordersList) ? payload.ordersList : Array.isArray(payload.orders) ? payload.orders : []
        const orderCount = Array.isArray(payload.orders) ? recent.length : Number(payload.orders ?? recent.length)
        setDash({ ...emptyDash, ...payload, orders: orderCount, ordersList: recent })
      })
      .catch(() => {})
  }, [])

  const sales = dash.sales
  const seats = dash.seats
  const orders = Array.isArray(dash.ordersList) ? dash.ordersList : []
  const published = dash.announcements
  const revenueSeries = dash.revenueSeries
  const genreSplit = dash.genreSplit
  const waiting = dash.waiting
  const activity = dash.activity

  const stats = [
    { label: "Ticket sales", value: money(sales), note: `${seats} seats sold`, to: "/admin/reports" },
    { label: "Orders", value: String(dash.orders), note: "Platform-wide", to: "/admin/tickets" },
    { label: "Events", value: String(dash.events), note: `${dash.pendingEvents} waiting for approval`, to: "/admin/events" },
    { label: "Workshops", value: String(dash.workshops), note: "Registrations open", to: "/admin/workshops" },
    { label: "Enrollments", value: String(dash.enrollments), note: "Course requests", to: "/admin/enrollments" },
    { label: "Accounts", value: String(dash.accounts), note: `${published} announcements live`, to: "/admin/users" },
  ]

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Admin</p>
      <h1 className="mt-1 font-display text-3xl text-white">Dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        {`${user?.name || "Admin"}, this is the platform overview from the database. Open a card to review that area.`}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} className="rounded-2xl border border-white/10 bg-panel p-4 transition hover:border-violet-400/40">
            <p className="text-sm text-zinc-400">{stat.label}</p>
            <p className="mt-2 font-display text-3xl text-white">{stat.value}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-violet-200">
              {stat.note} <ArrowUpRight className="h-3 w-3" />
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {shortcuts.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-panel px-3 py-3 text-sm text-zinc-200 transition hover:border-violet-400/40 hover:text-white"
            >
              <Icon className="h-4 w-4 text-violet-300" />
              {item.label}
            </Link>
          )
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <article className="rounded-2xl border border-white/10 bg-panel p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-white">Ticket revenue</h2>
              <p className="text-sm text-zinc-500">May through October</p>
            </div>
            <Link to="/admin/reports" className="text-sm text-violet-300">
              Reports
            </Link>
          </div>
          <AreaChart series={revenueSeries} />
          <div className="mt-2 grid grid-cols-6 text-center text-xs text-zinc-500">
            {revenueSeries.map((item) => (
              <span key={item.label}>{item.label}</span>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-white/10 bg-panel p-5">
          <h2 className="font-display text-xl text-white">Genre mix</h2>
          <div className="mt-4 flex items-center gap-4">
            <DonutChart slices={genreSplit} />
            <ul className="space-y-2 text-sm">
              {genreSplit.map((slice) => (
                <li key={slice.label} className="flex items-center gap-2 text-zinc-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
                  {slice.label}
                  <span className="text-zinc-500">{slice.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr_0.9fr]">
        <article className="rounded-2xl border border-white/10 bg-panel p-5">
          <h2 className="font-display text-xl text-white">Needs a decision</h2>
          <ul className="mt-4 space-y-3">
            {waiting.map((item) => (
              <li key={item.id}>
                <Link to={item.to} className="block rounded-xl border border-white/10 px-3 py-3 hover:border-violet-400/40">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-white">{item.title}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{item.detail}</p>
                </Link>
              </li>
            ))}
          </ul>
        </article>

        <article className="overflow-x-auto rounded-2xl border border-white/10 bg-panel">
          <div className="flex items-center justify-between px-4 py-4">
            <h2 className="font-display text-xl text-white">Recent orders</h2>
            <Link to="/admin/tickets" className="text-sm text-violet-300">
              View all
            </Link>
          </div>
          <table className="min-w-full text-left text-sm">
            <tbody className="divide-y divide-white/6">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 text-white">{order.id}</td>
                  <td className="px-4 py-3 text-zinc-300">{order.buyer}</td>
                  <td className="px-4 py-3 text-zinc-400">{order.event}</td>
                  <td className="px-4 py-3 text-white">{money(order.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="rounded-2xl border border-white/10 bg-panel p-5">
          <h2 className="font-display text-xl text-white">Activity</h2>
          <ul className="mt-4 space-y-4">
            {activity.map((item) => (
              <li key={item.id} className="border-l border-violet-400/40 pl-3">
                <p className="text-sm text-zinc-200">{item.text}</p>
                <p className="text-xs text-zinc-500">{item.time}</p>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}
