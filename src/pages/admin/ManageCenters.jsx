import ApprovalQueue, { ApprovalStatus } from "../../components/admin/ApprovalQueue"
import { Td } from "../../components/ui/DataTable"
import { useTitle } from "../../lib/useTitle"

export default function ManageCenters() {
  useTitle("Review music centers")
  return (
    <ApprovalQueue
      title="Music centers"
      description="Approve or reject learning centers submitted by organizers. This desk does not create, edit, or delete centers."
      listKey="items"
      reviewBase="/api/programs/centers"
      searchKeys={["name", "city", "email", "focus", "organizer"]}
      columns={["Center", "Organizer", "City", "Contact", "Status", ""]}
      renderCells={(row) => (
        <>
          <Td className="font-medium text-white">{row.name}</Td>
          <Td>{row.organizer}</Td>
          <Td>{row.city}</Td>
          <Td>{row.email}</Td>
          <ApprovalStatus row={row} />
        </>
      )}
      detail={(row) => [
        ["Name", row.name],
        ["Organizer", row.organizer],
        ["City", row.city],
        ["Area", row.area],
        ["Phone", row.phone],
        ["Email", row.email],
        ["Hours", row.hours],
        ["Focus", row.focus],
        ["Status", row.status],
        ["Rejection reason", row.rejectionReason],
      ]}
    />
  )
}
