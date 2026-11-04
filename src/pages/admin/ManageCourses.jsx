import ApprovalQueue, { ApprovalStatus } from "../../components/admin/ApprovalQueue"
import { Td } from "../../components/ui/DataTable"
import { longDate, money, timeRange } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

export default function ManageCourses() {
  useTitle("Review courses")
  return (
    <ApprovalQueue
      title="Courses"
      description="Approve or reject courses submitted by organizers. This desk does not create, edit, or delete courses."
      listKey="items"
      reviewBase="/api/programs/courses"
      searchKeys={["title", "instructor", "center", "instrument", "organizer"]}
      columns={["Course", "Organizer", "When", "Price", "Status", ""]}
      renderCells={(row) => (
        <>
          <Td className="text-white">
            <p className="font-medium">{row.title}</p>
            <p className="text-xs text-zinc-500">{row.instrument} · {row.level}</p>
          </Td>
          <Td>{row.organizer}</Td>
          <Td>
            {longDate(row.date)} · {timeRange(row.startTime, row.endTime)}
            <p className="text-xs text-zinc-500">{row.location}</p>
          </Td>
          <Td>{money(row.price)}</Td>
          <ApprovalStatus row={row} />
        </>
      )}
      detail={(row) => [
        ["Course", row.title],
        ["Instrument", row.instrument],
        ["Level", row.level],
        ["Instructor", row.instructor],
        ["Center", row.center],
        ["Organizer", row.organizer],
        ["Date", longDate(row.date)],
        ["Starting time", timeRange(row.startTime)],
        ["Ending time", timeRange(row.endTime)],
        ["Location", row.location],
        ["Weekly schedule", row.schedule],
        ["Price", money(row.price)],
        ["Status", row.status],
        ["Rejection reason", row.rejectionReason],
      ]}
    />
  )
}
