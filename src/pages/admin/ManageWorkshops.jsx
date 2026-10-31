import ResourceScreen, { Cell } from "../../components/admin/ResourceScreen"
import { workshopCategories, workshops } from "../../data/content"
import { longDate, money } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

const seed = workshops.map((workshop) => ({
  id: workshop.id,
  title: workshop.title,
  instructor: workshop.instructor,
  category: workshop.category,
  date: workshop.date,
  location: workshop.location,
  city: workshop.city,
  fee: workshop.fee,
  seats: workshop.seats,
  status: "Published",
}))

export default function ManageWorkshops() {
  useTitle("Manage workshops")
  return (
    <ResourceScreen
      title="Workshops"
      description="Short courses and masterclasses with a teacher, a room, and a fee."
      createLabel="Add workshop"
      seed={seed}
      searchKeys={["title", "instructor", "location", "city"]}
      filters={[{ key: "category", label: "Categories", options: workshopCategories }, { key: "status", label: "Statuses", options: ["Published", "Draft"] }]}
      columns={["Workshop", "Teacher", "Schedule", "Fee", "Status", ""]}
      fields={[
        { name: "title", label: "Title" },
        { name: "instructor", label: "Instructor" },
        { name: "category", label: "Category", type: "select", options: workshopCategories },
        { name: "date", label: "Date", type: "date" },
        { name: "location", label: "Location" },
        { name: "city", label: "City" },
        { name: "fee", label: "Fee", type: "number" },
        { name: "seats", label: "Seats", type: "number" },
        { name: "status", label: "Status", type: "select", options: ["Published", "Draft"] },
      ]}
      renderCells={(row) => (
        <>
          <Cell className="text-white">
            <p className="font-medium">{row.title}</p>
            <p className="text-xs text-zinc-500">{row.category}</p>
          </Cell>
          <Cell>{row.instructor}</Cell>
          <Cell>
            {longDate(row.date)}
            <p className="text-xs text-zinc-500">{row.location}</p>
          </Cell>
          <Cell>
            {money(row.fee)}
            <p className="text-xs text-zinc-500">{row.seats} seats</p>
          </Cell>
          <Cell>{row.status}</Cell>
        </>
      )}
      detail={(row) => [
        ["Title", row.title],
        ["Instructor", row.instructor],
        ["Category", row.category],
        ["Date", longDate(row.date)],
        ["Location", `${row.location}, ${row.city}`],
        ["Fee", money(row.fee)],
        ["Seats", row.seats],
        ["Status", row.status],
      ]}
    />
  )
}
