import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import CourseCard from "../components/cards/CourseCard"
import Container from "../components/ui/Container"
import PageHero from "../components/ui/PageHero"
import { ChoicePills } from "../components/ui/Field"
import { instruments } from "../data/content"
import { cachedRows, loadPublishedCourses, sameCatalog } from "../lib/catalog"
import { useTitle } from "../lib/useTitle"

const prices = ["Any price", "Under $100", "$100 – $140", "$140 and above"]

export default function Courses() {
  useTitle("Music Courses")
  const [courses, setCourses] = useState(() => cachedRows("courses") || [])
  const [query, setQuery] = useState("")
  const [instrument, setInstrument] = useState("All")
  const [studio, setStudio] = useState("All")
  const [price, setPrice] = useState("Any price")
  const studios = ["All", ...new Set(courses.map((course) => course.center).filter(Boolean))]

  useEffect(() => {
    loadPublishedCourses().then((nextCourses) => {
      setCourses((current) => (sameCatalog(current, nextCourses) ? current : nextCourses))
    })
  }, [])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return courses.filter((course) => {
      const matchesQuery =
        !needle ||
        [course.title, course.instructor, course.instrument, course.center, course.location]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(needle))
      const matchesInstrument = instrument === "All" || course.instrument === instrument
      const matchesStudio = studio === "All" || course.center === studio
      const matchesPrice =
        price === "Any price" ||
        (price === "Under $100" && course.price < 100) ||
        (price === "$100 – $140" && course.price >= 100 && course.price <= 140) ||
        (price === "$140 and above" && course.price > 140)
      return matchesQuery && matchesInstrument && matchesStudio && matchesPrice
    })
  }, [courses, query, instrument, studio, price])

  return (
    <>
      <PageHero
        compact
        eyebrow="Learn"
        title="Music courses"
        subtitle="Lessons and longer tracks. Filter by instrument, studio, and price."
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
              Studio
              <select value={studio} onChange={(event) => setStudio(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-ink px-3 py-3 text-sm text-white outline-none">
                {studios.map((option) => (
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
      </Container>
    </>
  )
}
