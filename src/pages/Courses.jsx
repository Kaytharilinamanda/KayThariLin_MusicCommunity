import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import CourseCard from "../components/cards/CourseCard"
import SchoolCard from "../components/cards/SchoolCard"
import Button from "../components/ui/Button"
import Container from "../components/ui/Container"
import Modal from "../components/ui/Modal"
import PageHero from "../components/ui/PageHero"
import { ChoicePills, TextArea, TextField } from "../components/ui/Field"
import { instruments } from "../data/content"
import { cachedRows, loadPublishedCenters, loadPublishedCourses, sameCatalog } from "../lib/catalog"
import { useAppState } from "../context/AppState"
import { useTitle } from "../lib/useTitle"

const prices = ["Any price", "Under $100", "$100 – $140", "$140 and above"]

export default function Courses() {
  useTitle("Music Courses")
  const [courses, setCourses] = useState(() => cachedRows("courses") || [])
  const [schools, setSchools] = useState(() => cachedRows("centers") || [])
  const [query, setQuery] = useState("")
  const [instrument, setInstrument] = useState("All")
  const [city, setCity] = useState("All")
  const [price, setPrice] = useState("Any price")
  const [contact, setContact] = useState(null)
  const [note, setNote] = useState({ name: "", email: "", message: "" })
  const [sent, setSent] = useState(false)
  const { notify, user } = useAppState()
  const navigate = useNavigate()
  const cities = ["All", ...new Set(schools.map((school) => school.city))]

  useEffect(() => {
    Promise.all([loadPublishedCourses(), loadPublishedCenters()]).then(([nextCourses, nextSchools]) => {
      setCourses((current) => (sameCatalog(current, nextCourses) ? current : nextCourses))
      setSchools((current) => (sameCatalog(current, nextSchools) ? current : nextSchools))
    })
  }, [])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return courses.filter((course) => {
      const school = schools.find((item) => item.id === course.centerId)
      const matchesQuery =
        !needle ||
        [course.title, course.instructor, course.instrument, school?.name, school?.city, course.center]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(needle))
      const matchesInstrument = instrument === "All" || course.instrument === instrument
      const matchesCity = city === "All" || school?.city === city
      const matchesPrice =
        price === "Any price" ||
        (price === "Under $100" && course.price < 100) ||
        (price === "$100 – $140" && course.price >= 100 && course.price <= 140) ||
        (price === "$140 and above" && course.price > 140)
      return matchesQuery && matchesInstrument && matchesCity && matchesPrice
    })
  }, [courses, schools, query, instrument, city, price])

  function sendNote(event) {
    event.preventDefault()
    if (!note.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(note.email) || note.message.trim().length < 8) {
      notify("Add your name, email, and a short message.")
      return
    }
    setSent(true)
    notify("Note kept in this preview.")
  }

  return (
    <>
      <PageHero
        compact
        eyebrow="Learn"
        title="Music courses"
        subtitle="Lessons and longer tracks at studios you can visit. Filter by instrument, city, and price."
        image="/images/piano-hall.jpg"
      />
      <Container className="pt-6 pb-10">
        <div className="space-y-4 rounded-3xl border border-[#f3d6da] bg-raised p-5 shadow-sm">
          <label className="relative block">
            <span className="sr-only">Search courses</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses, teachers, studios"
              className="w-full rounded-2xl border border-white/10 bg-ink py-3 pr-3 pl-10 text-sm outline-none focus:border-violet-400/70"
            />
          </label>
          <ChoicePills label="Instrument" options={["All", ...instruments]} value={instrument} onChange={setInstrument} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-zinc-400">
              Location
              <select value={city} onChange={(event) => setCity(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-ink px-3 py-3 text-sm text-white outline-none">
                {cities.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-zinc-400">
              Price
              <select value={price} onChange={(event) => setPrice(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-ink px-3 py-3 text-sm text-white outline-none">
                {prices.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="mt-6 text-sm text-zinc-400">{visible.length} courses</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
        {visible.length === 0 && (
          <p className="mt-6 rounded-3xl border border-dashed border-white/15 px-6 py-16 text-center text-zinc-300">
            No courses match those filters.
          </p>
        )}

        <div className="mt-16">
          <h2 className="font-display text-3xl text-white">Studios and learning centers</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Contact cards for the schools behind the courses. Send a note from here — it stays in the preview.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {schools.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                onContact={(selected) => {
                  if (user?.role !== "user") {
                    notify(user ? "Course enquiries use a user account." : "Sign in to contact a learning center.")
                    if (!user) navigate("/login", { state: { from: "/courses" } })
                    return
                  }
                  setContact(selected)
                  setSent(false)
                  setNote({ name: user.name || "", email: user.email || "", message: "" })
                }}
              />
            ))}
          </div>
        </div>
      </Container>

      <Modal
        open={Boolean(contact)}
        title={contact ? `Note to ${contact.name}` : "Contact"}
        subtitle={contact?.email}
        onClose={() => setContact(null)}
      >
        {sent ? (
          <p className="text-sm text-emerald-100">Your note is ready in this preview. No message was sent.</p>
        ) : (
          <form className="space-y-4" onSubmit={sendNote}>
            <TextField id="school-name" label="Your name" value={note.name} onChange={(event) => setNote((current) => ({ ...current, name: event.target.value }))} />
            <TextField id="school-email" label="Email" type="email" value={note.email} onChange={(event) => setNote((current) => ({ ...current, email: event.target.value }))} />
            <TextArea id="school-message" label="Message" value={note.message} onChange={(event) => setNote((current) => ({ ...current, message: event.target.value }))} />
            <Button type="submit">Send note</Button>
          </form>
        )}
      </Modal>
    </>
  )
}
