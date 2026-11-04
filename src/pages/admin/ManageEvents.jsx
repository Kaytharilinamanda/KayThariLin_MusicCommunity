import ApprovalQueue, { ApprovalStatus } from "../../components/admin/ApprovalQueue"
import { Td } from "../../components/ui/DataTable"
import { longDate, money } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

export default function ManageEvents() {
  useTitle("Review events")
  return (
    <ApprovalQueue
      title="Events"
      description="Approve or reject events submitted by organizers. Approved events appear on the public calendar. This desk does not create, edit, or delete events."
      listKey="events"
      reviewBase="/api/events"
      searchKeys={["title", "artist", "city", "venue", "organizer"]}
      columns={["Event", "Organizer", "When", "Where", "Status", ""]}
      renderCells={(row) => (
        <>
          <Td className="text-white">
            <p className="font-medium">{row.title}</p>
            <p className="text-xs text-zinc-500">{row.artist}</p>
          </Td>
          <Td>
            {row.organizer}
            {row.organization ? <p className="text-xs text-zinc-500">{row.organization}</p> : null}
          </Td>
          <Td>
            {longDate(row.date)}
            <p className="text-xs text-zinc-500">{row.time}</p>
          </Td>
          <Td>
            {row.venue}
            <p className="text-xs text-zinc-500">{row.city}</p>
          </Td>
          <ApprovalStatus row={row} />
        </>
      )}
      detail={(row) => [
        ["Title", row.title],
        ["Artist", row.artist],
        ["Category", row.category],
        ["Organizer", row.organization ? `${row.organizer} · ${row.organization}` : row.organizer],
        ["Date", longDate(row.date)],
        ["Time", row.time],
        ["Venue", row.venue],
        ["Address", row.address],
        ["City", row.city],
        ["From price", money(row.price)],
        ["Status", row.status],
        ["Rejection reason", row.rejectionReason],
        ["Note", row.blurb],
      ]}
    />
  )
}
