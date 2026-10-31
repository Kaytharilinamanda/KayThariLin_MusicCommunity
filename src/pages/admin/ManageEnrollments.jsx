import ResourceScreen, { Cell, StatusBadge } from "../../components/admin/ResourceScreen"
import { enrollments } from "../../data/content"
import { longDate } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

export default function ManageEnrollments() {
  useTitle("Enrollments")
  return (
    <ResourceScreen
      title="Enrollments"
      description="Students asking for a place in a course."
      createLabel="Add enrollment"
      seed={enrollments}
      searchKeys={["student", "email", "course", "center"]}
      filters={[{ key: "status", label: "Statuses", options: ["Confirmed", "Pending", "Waitlist"] }]}
      columns={["Student", "Course", "Studio", "Date", "Status", ""]}
      fields={[
        { name: "student", label: "Student" },
        { name: "email", label: "Email", type: "email" },
        { name: "course", label: "Course" },
        { name: "center", label: "Music center" },
        { name: "date", label: "Date", type: "date" },
        { name: "status", label: "Status", type: "select", options: ["Confirmed", "Pending", "Waitlist"] },
      ]}
      renderCells={(row) => (
        <>
          <Cell className="text-white">
            <p className="font-medium">{row.student}</p>
            <p className="text-xs text-zinc-500">{row.email}</p>
          </Cell>
          <Cell>{row.course}</Cell>
          <Cell>{row.center}</Cell>
          <Cell>{longDate(row.date)}</Cell>
          <Cell>
            <StatusBadge status={row.status} />
          </Cell>
        </>
      )}
      detail={(row) => [
        ["Student", row.student],
        ["Email", row.email],
        ["Course", row.course],
        ["Center", row.center],
        ["Date", longDate(row.date)],
        ["Status", row.status],
      ]}
    />
  )
}
