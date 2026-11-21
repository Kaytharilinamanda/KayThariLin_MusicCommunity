import ProgramDesk from "../../components/organizer/ProgramDesk"
import { DataTable, Td } from "../../components/ui/DataTable"
import Button from "../../components/ui/Button"
import { StatusBadge } from "../../components/admin/ResourceScreen"
import { useAppState } from "../../context/AppState"
import { instruments, workshopCategories } from "../../data/content"
import { api } from "../../lib/api"
import { useDeskRows } from "../../lib/deskCache"
import { longDate, money, timeRange } from "../../lib/format"
import { useTitle } from "../../lib/useTitle"

const levels = ["Beginner", "Intermediate", "All levels"]

export function OrganizerWorkshops() {
  return (
    <>
    <WorkshopSignups first />
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
      withImage
      render={(row) => (
        <>
          <Td className="text-white">
            <div className="flex items-center gap-3">
              <img src={row.image || "/images/studio.jpg"} alt="" className="h-14 w-20 rounded-lg object-cover" />
              <div>
                <p className="font-medium">{row.title}</p>
                <p className="text-xs text-zinc-500">{row.instructor} · {row.category}</p>
              </div>
            </div>
          </Td>
          <Td>{longDate(row.date)} · {timeRange(row.startTime, row.endTime)}</Td>
          <Td>{row.location}, {row.city}</Td>
          <Td>{money(row.fee)} · {row.seats} seats</Td>
        </>
      )}
    />
    </>
  )
}

export function OrganizerCourses() {
  return (
    <>
    <CourseSignups first />
    <ProgramDesk
      kind="courses"
      title="Courses"
      text="Create, edit, and delete your courses. Each save is submitted to the admin. Approved courses appear on the public course list."
      fields={[
        { name: "title", label: "Title" },
        { name: "instrument", label: "Instrument", type: "select", options: instruments },
        { name: "level", label: "Level", type: "select", options: levels },
        { name: "instructor", label: "Instructor" },
        { name: "center", label: "Studio" },
        { name: "date", label: "Date", type: "date" },
        { name: "startTime", label: "Starting time", type: "time" },
        { name: "endTime", label: "Ending time", type: "time" },
        { name: "location", label: "Location" },
        { name: "schedule", label: "Weekly schedule" },
        { name: "price", label: "Price (USD)", type: "number" },
      ]}
      columns={["Course", "When", "Where", "Price"]}
      withImage
      render={(row) => (
        <>
          <Td className="text-white">
            <div className="flex items-center gap-3">
              <img src={row.image || "/images/piano.jpg"} alt="" className="h-14 w-20 rounded-lg object-cover" />
              <div>
                <p className="font-medium">{row.title}</p>
                <p className="text-xs text-zinc-500">{row.instrument} · {row.level}</p>
              </div>
            </div>
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
    </>
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

export function OrganizerEnrollments() {
  useTitle("Enrollments")
  return (
    <>
      <WorkshopSignups first />
      <CourseSignups />
    </>
  )
}

function WorkshopSignups({ first = false }) {
  return (
    <Signups
      first={first}
      endpoint="/api/workshop-registrations"
      listKey="registrations"
      title="Workshop registrations"
      text="Students who registered from your workshop pages. Confirm a seat so the student knows it is held."
      confirmStatus="Confirmed"
      columns={["Student", "Workshop", "Contact", "Experience", "Status", ""]}
      empty="No workshop registrations yet."
      render={(row, confirm) => (
        <>
          <Td className="text-white">
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-zinc-500">{row.email}</p>
          </Td>
          <Td>
            {row.title}
            <p className="text-xs text-zinc-500">{longDate(row.date)} · {row.city}</p>
          </Td>
          <Td>{row.phone}</Td>
          <Td>{row.level}</Td>
          <Td><StatusBadge status={row.status} /></Td>
          <Td>{row.status === "Pending" ? <Button onClick={() => confirm(row)}>Confirm</Button> : null}</Td>
        </>
      )}
    />
  )
}

function CourseSignups({ first = false }) {
  return (
    <Signups
      first={first}
      endpoint="/api/enrollments"
      listKey="enrollments"
      title="Course enrollments"
      text="Students who enrolled from your course pages. Confirm an enrollment so the student is enrolled. The admin desk does not see this list."
      confirmStatus="Enrolled"
      columns={["Student", "Course", "Contact", "Note", "Status", ""]}
      empty="No course enrollments yet."
      render={(row, confirm) => (
        <>
          <Td className="text-white">
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-zinc-500">{row.email}</p>
          </Td>
          <Td>
            {row.title}
            <p className="text-xs text-zinc-500">{row.center} · {longDate(row.date)}</p>
          </Td>
          <Td>{row.phone}</Td>
          <Td>{row.message}</Td>
          <Td><StatusBadge status={row.status} /></Td>
          <Td>{row.status === "Pending" ? <Button onClick={() => confirm(row)}>Confirm</Button> : null}</Td>
        </>
      )}
    />
  )
}

function Signups({ endpoint, listKey, title, text, columns, empty, render, first = false, confirmStatus }) {
  const { notify } = useAppState()
  const { rows, setRows, ready } = useDeskRows(endpoint, listKey)

  async function confirm(row) {
    try {
      const data = await api(`${endpoint}/${row.id}`, { method: "PATCH", body: { status: confirmStatus } })
      const next = data.registration || data.enrollment
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, status: next.status } : item)))
      notify(confirmStatus === "Enrolled" ? "Enrollment confirmed." : "Registration confirmed.")
    } catch (error) {
      notify(error.message)
    }
  }

  return (
    <section className={first ? "mb-10" : "mt-10"}>
      <div className="mb-6">
        <h2 className={first ? "font-display text-3xl text-white" : "font-display text-2xl text-white"}>{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">{text}</p>
      </div>
      <DataTable columns={columns} rows={rows} empty={ready ? empty : ""} render={(row) => render(row, confirm)} />
    </section>
  )
}
