import ApprovalQueue, { ApprovalStatus } from "../../components/admin/ApprovalQueue"
import { Td } from "../../components/ui/DataTable"
import { longDate, money, timeRange } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

export default function ManageWorkshops() {
  useTitle("Review workshops")
  return (
    <ApprovalQueue
      title="Workshops"
      description="Approve or reject workshops submitted by organizers. This desk does not create, edit, or delete workshops."
      listKey="items"
      reviewBase="/api/programs/workshops"
      searchKeys={["title", "instructor", "location", "city", "organizer"]}
      columns={["Workshop", "Organizer", "When", "Fee", "Status", ""]}
      renderCells={(row) => (
        <>
          <Td className="text-white">
            <p className="font-medium">{row.title}</p>
            <p className="text-xs text-zinc-500">{row.instructor}</p>
          </Td>
          <Td>{row.organizer}</Td>
          <Td>
            {longDate(row.date)} · {timeRange(row.startTime, row.endTime)}
            <p className="text-xs text-zinc-500">{row.location}</p>
          </Td>
          <Td>{money(row.fee)}</Td>
          <ApprovalStatus row={row} />
        </>
      )}
      detail={(row) => [
        ["Title", row.title],
        ["Instructor", row.instructor],
        ["Category", row.category],
        ["Organizer", row.organizer],
        ["Date", longDate(row.date)],
        ["Starting time", timeRange(row.startTime)],
        ["Ending time", timeRange(row.endTime)],
        ["Location", `${row.location}, ${row.city}`],
        ["Fee", money(row.fee)],
        ["Seats", String(row.seats ?? "")],
        ["Status", row.status],
        ["Rejection reason", row.rejectionReason],
      ]}
    />
  )
}
