import ResourceScreen, { Cell } from "../../components/admin/ResourceScreen"
import { schools } from "../../data/content"
import { useTitle } from "../../lib/useTitle"

const seed = schools.map((school) => ({
  id: school.id,
  name: school.name,
  city: school.city,
  area: school.area,
  phone: school.phone,
  email: school.email,
  hours: school.hours,
  focus: school.focus,
  status: "Active",
}))

export default function ManageCenters() {
  useTitle("Music centers")
  return (
    <ResourceScreen
      title="Music centers"
      description="Schools and studios listed beside the courses."
      createLabel="Add center"
      seed={seed}
      searchKeys={["name", "city", "email", "focus"]}
      filters={[{ key: "city", label: "Cities", options: ["Yangon", "Singapore"] }, { key: "status", label: "Statuses", options: ["Active", "Paused"] }]}
      columns={["Center", "City", "Contact", "Focus", "Status", ""]}
      fields={[
        { name: "name", label: "Name" },
        { name: "city", label: "City" },
        { name: "area", label: "Area" },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email", type: "email" },
        { name: "hours", label: "Hours" },
        { name: "focus", label: "Focus" },
        { name: "status", label: "Status", type: "select", options: ["Active", "Paused"] },
      ]}
      renderCells={(row) => (
        <>
          <Cell className="font-medium text-white">{row.name}</Cell>
          <Cell>
            {row.city}
            <p className="text-xs text-zinc-500">{row.area}</p>
          </Cell>
          <Cell>
            {row.email}
            <p className="text-xs text-zinc-500">{row.phone}</p>
          </Cell>
          <Cell>{row.focus}</Cell>
          <Cell>{row.status}</Cell>
        </>
      )}
      detail={(row) => [
        ["Name", row.name],
        ["City", `${row.area}, ${row.city}`],
        ["Phone", row.phone],
        ["Email", row.email],
        ["Hours", row.hours],
        ["Focus", row.focus],
        ["Status", row.status],
      ]}
    />
  )
}
