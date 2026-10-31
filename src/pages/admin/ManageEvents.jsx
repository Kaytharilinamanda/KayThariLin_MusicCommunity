import ResourceScreen, { Cell, StatusBadge } from "../../components/admin/ResourceScreen"
import { categories, events } from "../../data/content"
import { longDate, money } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

const seed = [
  {
    id: "EV-review",
    title: "Harbor Session",
    artist: "Local bill",
    category: "Live",
    date: "2026-12-01",
    city: "Yangon",
    venue: "The Loft",
    price: 25,
    status: "Pending approval",
  },
  ...events.map((event) => ({
  id: event.id,
  title: event.title,
  artist: event.artist,
  category: event.category,
  date: event.date,
  city: event.city,
  venue: event.venue,
  price: event.price,
  status: event.status,
})),
]

export default function ManageEvents() {
  useTitle("Manage events")
  return (
    <ResourceScreen
      title="Events"
      description="Review organizer submissions before they go public. Approve a pending event by editing its status to Published."
      createLabel="Add event"
      seed={seed}
      searchKeys={["title", "artist", "city", "venue"]}
      filters={[{ key: "category", label: "Categories", options: categories }, { key: "status", label: "Statuses", options: ["Pending approval", "Published", "Rejected", "Draft", "Sold out"] }]}
      columns={["Event", "When", "Where", "Price", "Status", ""]}
      fields={[
        { name: "title", label: "Title" },
        { name: "artist", label: "Artist" },
        { name: "category", label: "Category", type: "select", options: categories },
        { name: "date", label: "Date", type: "date" },
        { name: "city", label: "City" },
        { name: "venue", label: "Venue" },
        { name: "price", label: "From price", type: "number" },
        { name: "status", label: "Status", type: "select", options: ["Pending approval", "Published", "Rejected", "Draft", "Sold out"] },
      ]}
      renderCells={(row) => (
        <>
          <Cell className="text-white">
            <p className="font-medium">{row.title}</p>
            <p className="text-xs text-zinc-500">{row.artist}</p>
          </Cell>
          <Cell>{longDate(row.date)}</Cell>
          <Cell>
            {row.venue}
            <p className="text-xs text-zinc-500">{row.city}</p>
          </Cell>
          <Cell>{money(row.price)}</Cell>
          <Cell>
            <StatusBadge status={row.status} />
          </Cell>
        </>
      )}
      detail={(row) => [
        ["Title", row.title],
        ["Artist", row.artist],
        ["Category", row.category],
        ["Date", longDate(row.date)],
        ["Venue", row.venue],
        ["City", row.city],
        ["Price", money(row.price)],
        ["Status", row.status],
      ]}
    />
  )
}
