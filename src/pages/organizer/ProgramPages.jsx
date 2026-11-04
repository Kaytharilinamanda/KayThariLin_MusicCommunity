import ProgramDesk from "../../components/organizer/ProgramDesk"
import { Td } from "../../components/ui/DataTable"
import { instruments, workshopCategories } from "../../data/content"
import { longDate, money, timeRange } from "../../lib/format"

const levels = ["Beginner", "Intermediate", "All levels"]

export function OrganizerWorkshops() {
  return (
    <ProgramDesk
      kind="workshops"
      title="Workshops"
      text="Create, edit, and delete your workshops. Each save is submitted to the admin. Approved workshops appear on the public workshop list."
      fields={[
        { name: "title", label: "Title" },
        { name: "instructor", label: "Instructor" },
        { name: "category", label: "Category", type: "select", options: workshopCategories },
        { name: "date", label: "Date", type: "date" },
        { name: "startTime", label: "Starting time", type: "time" },
        { name: "endTime", label: "Ending time", type: "time" },
        { name: "location", label: "Location" },
        { name: "city", label: "City" },
        { name: "fee", label: "Fee (USD)", type: "number" },
        { name: "seats", label: "Seats", type: "number" },
      ]}
      columns={["Workshop", "When", "Where", "Fee"]}
      render={(row) => (
        <>
          <Td className="text-white">
            <p className="font-medium">{row.title}</p>
            <p className="text-xs text-zinc-500">{row.instructor} · {row.category}</p>
          </Td>
          <Td>{longDate(row.date)} · {timeRange(row.startTime, row.endTime)}</Td>
          <Td>{row.location}, {row.city}</Td>
          <Td>{money(row.fee)} · {row.seats} seats</Td>
        </>
      )}
    />
  )
}

export function OrganizerCourses() {
  return (
    <ProgramDesk
      kind="courses"
      title="Courses"
      text="Create, edit, and delete your courses. Each save is submitted to the admin. Approved courses appear on the public course list."
      fields={[
        { name: "title", label: "Title" },
        { name: "instrument", label: "Instrument", type: "select", options: instruments },
        { name: "level", label: "Level", type: "select", options: levels },
        { name: "instructor", label: "Instructor" },
        { name: "center", label: "Music center" },
        { name: "date", label: "Date", type: "date" },
        { name: "startTime", label: "Starting time", type: "time" },
        { name: "endTime", label: "Ending time", type: "time" },
        { name: "location", label: "Location" },
        { name: "schedule", label: "Weekly schedule" },
        { name: "price", label: "Price (USD)", type: "number" },
      ]}
      columns={["Course", "When", "Where", "Price"]}
      render={(row) => (
        <>
          <Td className="text-white">
            <p className="font-medium">{row.title}</p>
            <p className="text-xs text-zinc-500">{row.instrument} · {row.level}</p>
          </Td>
          <Td>{longDate(row.date)} · {timeRange(row.startTime, row.endTime)}</Td>
          <Td>
            {row.location}
            <p className="text-xs text-zinc-500">{row.center}</p>
          </Td>
          <Td>{money(row.price)}</Td>
        </>
      )}
    />
  )
}

export function OrganizerCategories() {
  return (
    <ProgramDesk
      kind="categories"
      title="Course categories"
      text="Create, edit, and delete course categories. The admin approves a category before it is accepted."
      fields={[
        { name: "name", label: "Name" },
        { name: "courses", label: "Listed courses", type: "number" },
      ]}
      columns={["Category", "Courses"]}
      render={(row) => (
        <>
          <Td className="font-medium text-white">{row.name}</Td>
          <Td>{row.courses}</Td>
        </>
      )}
    />
  )
}

export function OrganizerCenters() {
  return (
    <ProgramDesk
      kind="centers"
      title="Music centers"
      text="Create, edit, and delete learning centers. Approved centers are listed with the public courses."
      fields={[
        { name: "name", label: "Name" },
        { name: "city", label: "City" },
        { name: "area", label: "Area" },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email", type: "email" },
        { name: "hours", label: "Hours" },
        { name: "focus", label: "Focus" },
      ]}
      columns={["Center", "City", "Contact", "Focus"]}
      render={(row) => (
        <>
          <Td className="font-medium text-white">{row.name}</Td>
          <Td>{row.city}{row.area ? <p className="text-xs text-zinc-500">{row.area}</p> : null}</Td>
          <Td>
            {row.email}
            <p className="text-xs text-zinc-500">{row.phone}</p>
          </Td>
          <Td>{row.focus}</Td>
        </>
      )}
    />
  )
}

export function OrganizerEnrollments() {
  return (
    <ProgramDesk
      kind="enrollments"
      title="Enrollments"
      text="Record students asking for a place in your courses. The admin approves or rejects each enrollment."
      fields={[
        { name: "student", label: "Student" },
        { name: "email", label: "Email", type: "email" },
        { name: "course", label: "Course" },
        { name: "center", label: "Music center" },
        { name: "date", label: "Date", type: "date" },
      ]}
      columns={["Student", "Course", "Studio", "Date"]}
      render={(row) => (
        <>
          <Td className="text-white">
            <p className="font-medium">{row.student}</p>
            <p className="text-xs text-zinc-500">{row.email}</p>
          </Td>
          <Td>{row.course}</Td>
          <Td>{row.center}</Td>
          <Td>{longDate(row.date)}</Td>
        </>
      )}
    />
  )
}
