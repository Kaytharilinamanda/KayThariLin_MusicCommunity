import ResourceScreen, { Cell } from "../../components/admin/ResourceScreen"
import { courses, instruments, schoolById } from "../../data/content"
import { money } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

const seed = courses.map((course) => ({
  id: course.id,
  title: course.title,
  instrument: course.instrument,
  instructor: course.instructor,
  center: schoolById(course.centerId)?.name || "",
  price: course.price,
  level: course.level,
  schedule: course.schedule,
  status: "Published",
}))

export default function ManageCourses() {
  useTitle("Manage courses")
  return (
    <ResourceScreen
      title="Courses"
      description="Advertised lessons and longer tracks at partner studios."
      createLabel="Add course"
      seed={seed}
      searchKeys={["title", "instructor", "center", "instrument"]}
      filters={[{ key: "instrument", label: "Instruments", options: instruments }, { key: "status", label: "Statuses", options: ["Published", "Draft", "Full"] }]}
      columns={["Course", "Teacher", "Studio", "Price", "Status", ""]}
      fields={[
        { name: "title", label: "Title" },
        { name: "instrument", label: "Instrument", type: "select", options: instruments },
        { name: "level", label: "Level", type: "select", options: ["Beginner", "Intermediate", "All levels"] },
        { name: "instructor", label: "Instructor" },
        { name: "center", label: "Music center" },
        { name: "schedule", label: "Schedule" },
        { name: "price", label: "Price", type: "number" },
        { name: "status", label: "Status", type: "select", options: ["Published", "Draft", "Full"] },
      ]}
      renderCells={(row) => (
        <>
          <Cell className="text-white">
            <p className="font-medium">{row.title}</p>
            <p className="text-xs text-zinc-500">
              {row.instrument} · {row.level}
            </p>
          </Cell>
          <Cell>{row.instructor}</Cell>
          <Cell>
            {row.center}
            <p className="text-xs text-zinc-500">{row.schedule}</p>
          </Cell>
          <Cell>{money(row.price)}</Cell>
          <Cell>{row.status}</Cell>
        </>
      )}
      detail={(row) => [
        ["Course", row.title],
        ["Instrument", row.instrument],
        ["Level", row.level],
        ["Instructor", row.instructor],
        ["Center", row.center],
        ["Schedule", row.schedule],
        ["Price", money(row.price)],
        ["Status", row.status],
      ]}
    />
  )
}
