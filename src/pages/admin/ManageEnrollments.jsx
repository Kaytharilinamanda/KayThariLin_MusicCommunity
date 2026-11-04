import ApprovalQueue, { ApprovalStatus } from "../../components/admin/ApprovalQueue"
import { Td } from "../../components/ui/DataTable"
import { longDate } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

export default function ManageEnrollments() {
  useTitle("Review enrollments")
  return (
    <ApprovalQueue
      title="Enrollments"
      description="Approve or reject course enrollments submitted by organizers. This desk does not create, edit, or delete enrollments."
      listKey="items"
      reviewBase="/api/programs/enrollments"
      searchKeys={["student", "email", "course", "center", "organizer"]}
      columns={["Student", "Course", "Studio", "Date", "Status", ""]}
      renderCells={(row) => (
        <>
          <Td className="text-white">
            <p className="font-medium">{row.student}</p>
            <p className="text-xs text-zinc-500">{row.email}</p>
          </Td>
          <Td>{row.course}</Td>
          <Td>{row.center}</Td>
          <Td>{longDate(row.date)}</Td>
          <ApprovalStatus row={row} />
        </>
      )}
      detail={(row) => [
        ["Student", row.student],
        ["Email", row.email],
        ["Course", row.course],
        ["Center", row.center],
        ["Organizer", row.organizer],
        ["Date", longDate(row.date)],
        ["Status", row.status],
        ["Rejection reason", row.rejectionReason],
      ]}
    />
  )
}