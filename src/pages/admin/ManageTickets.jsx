import ResourceScreen, { Cell, StatusBadge } from "../../components/admin/ResourceScreen"
import { orders } from "../../data/content"
import { longDate, money } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

export default function ManageTickets() {
  useTitle("Ticket orders")
  return (
    <ResourceScreen
      title="Ticket orders"
      description="Reservations for concerts. Status changes are visual only."
      createLabel="Add order"
      seed={orders}
      searchKeys={["id", "buyer", "event", "email"]}
      filters={[{ key: "status", label: "Statuses", options: ["Paid", "Pending", "Refunded"] }]}
      columns={["Order", "Buyer", "Event", "Total", "Status", ""]}
      fields={[
        { name: "id", label: "Order number" },
        { name: "buyer", label: "Buyer" },
        { name: "email", label: "Email", type: "email" },
        { name: "event", label: "Event" },
        { name: "tier", label: "Ticket" },
        { name: "qty", label: "Quantity", type: "number" },
        { name: "total", label: "Total", type: "number" },
        { name: "date", label: "Date", type: "date" },
        { name: "status", label: "Status", type: "select", options: ["Paid", "Pending", "Refunded"] },
      ]}
      renderCells={(row) => (
        <>
          <Cell className="font-medium text-white">{row.id}</Cell>
          <Cell>
            {row.buyer}
            <p className="text-xs text-zinc-500">{row.email}</p>
          </Cell>
          <Cell>
            {row.event}
            <p className="text-xs text-zinc-500">
              {row.qty} × {row.tier}
            </p>
          </Cell>
          <Cell>{money(row.total)}</Cell>
          <Cell>
            <StatusBadge status={row.status} />
          </Cell>
        </>
      )}
      detail={(row) => [
        ["Order", row.id],
        ["Buyer", row.buyer],
        ["Email", row.email],
        ["Event", row.event],
        ["Ticket", `${row.qty} × ${row.tier}`],
        ["Date", longDate(row.date)],
        ["Total", money(row.total)],
        ["Status", row.status],
      ]}
    />
  )
}
