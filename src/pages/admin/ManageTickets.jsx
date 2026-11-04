import ApprovalQueue, { ApprovalStatus } from "../../components/admin/ApprovalQueue"
import { Td } from "../../components/ui/DataTable"
import { money } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

export default function ManageTickets() {
  useTitle("Review tickets")
  return (
    <ApprovalQueue
      title="Tickets"
      description="Approve or reject ticket tiers submitted by organizers. Approved tickets go on sale with an approved event. This desk does not create, edit, or delete tickets."
      listKey="tickets"
      reviewBase="/api/tickets"
      searchKeys={["event", "tier", "organizer"]}
      columns={["Ticket", "Organizer", "Price", "Window", "Status", ""]}
      renderCells={(row) => (
        <>
          <Td className="text-white">
            <p className="font-medium">{row.tier}</p>
            <p className="text-xs text-zinc-500">{row.event}</p>
          </Td>
          <Td>
            {row.organizer}
            {row.organization ? <p className="text-xs text-zinc-500">{row.organization}</p> : null}
          </Td>
          <Td>
            {money(row.price)}
            <p className="text-xs text-zinc-500">{row.quantity} seats</p>
          </Td>
          <Td>
            {row.salesStart || "—"} → {row.salesEnd || "—"}
          </Td>
          <ApprovalStatus row={row} />
        </>
      )}
      detail={(row) => [
        ["Event", row.event],
        ["Tier", row.tier],
        ["Organizer", row.organization ? `${row.organizer} · ${row.organization}` : row.organizer],
        ["Price", money(row.price)],
        ["Quantity", String(row.quantity)],
        ["Sales start", row.salesStart],
        ["Sales end", row.salesEnd],
        ["Status", row.status],
        ["Rejection reason", row.rejectionReason],
      ]}
    />
  )
}
