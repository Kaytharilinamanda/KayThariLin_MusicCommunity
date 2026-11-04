import ResourceScreen, { Cell, StatusBadge } from "../../components/admin/ResourceScreen"
import { longDate } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

export default function ManageAnnouncements() {
  useTitle("Announcements")
  return (
    <ResourceScreen
      title="Announcements"
      description="Notes published by organizers. This desk reads them."
      createLabel="Add announcement"
      endpoint="/api/announcements/manage"
      listKey="announcements"
      readOnly
      seed={[]}
      searchKeys={["title", "audience", "channel"]}
      filters={[{ key: "status", label: "Statuses", options: ["Published", "Draft", "Scheduled"] }]}
      columns={["Announcement", "Audience", "Channel", "Date", "Status", ""]}
      fields={[
        { name: "title", label: "Title" },
        { name: "audience", label: "Audience" },
        { name: "channel", label: "Channel", type: "select", options: ["Community", "Email", "Courses", "Studio desk"] },
        { name: "date", label: "Date", type: "date" },
        { name: "status", label: "Status", type: "select", options: ["Published", "Draft", "Scheduled"] },
      ]}
      renderCells={(row) => (
        <>
          <Cell className="font-medium text-white">{row.title}</Cell>
          <Cell>{row.audience}</Cell>
          <Cell>{row.channel}</Cell>
          <Cell>{longDate(row.date)}</Cell>
          <Cell>
            <StatusBadge status={row.status} />
          </Cell>
        </>
      )}
      detail={(row) => [
        ["Title", row.title],
        ["Audience", row.audience],
        ["Channel", row.channel],
        ["Date", longDate(row.date)],
        ["Status", row.status],
      ]}
    />
  )
}
