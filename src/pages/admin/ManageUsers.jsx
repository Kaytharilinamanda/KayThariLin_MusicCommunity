import ResourceScreen, { Cell, StatusBadge } from "../../components/admin/ResourceScreen"
import { adminUsers } from "../../data/content"
import { useTitle } from "../../lib/useTitle"
import LiveAccounts from "./LiveAccounts"

export default function ManageUsers() {
  useTitle("Users")
  return (
    <>
    <LiveAccounts
      title="Registered accounts"
      text="Create, edit, and delete user and organizer accounts. The studio admin account stays singular and is not edited here. The directory underneath is preview data for the rest of the studio."
    />
    <ResourceScreen
      title="Preview directory"
      description="Sample users, students, teachers, and staff. Changes here stay on this design page."
      createLabel="Add user"
      seed={adminUsers}
      searchKeys={["name", "email", "city", "role"]}
      filters={[
        { key: "role", label: "Roles", options: ["User", "Student", "Teacher", "Staff"] },
        { key: "status", label: "Statuses", options: ["Active", "Invited", "Suspended"] },
      ]}
      columns={["Person", "Role", "City", "Status", ""]}
      fields={[
        { name: "name", label: "Name" },
        { name: "email", label: "Email", type: "email" },
        { name: "role", label: "Role", type: "select", options: ["User", "Student", "Teacher", "Staff"] },
        { name: "city", label: "City" },
        { name: "status", label: "Status", type: "select", options: ["Active", "Invited", "Suspended"] },
      ]}
      renderCells={(row) => (
        <>
          <Cell className="text-white">
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-zinc-500">{row.email}</p>
          </Cell>
          <Cell>{row.role}</Cell>
          <Cell>{row.city}</Cell>
          <Cell>
            <StatusBadge status={row.status} />
          </Cell>
        </>
      )}
      detail={(row) => [
        ["Name", row.name],
        ["Email", row.email],
        ["Role", row.role],
        ["City", row.city],
        ["Status", row.status],
      ]}
    />
    </>
  )
}
