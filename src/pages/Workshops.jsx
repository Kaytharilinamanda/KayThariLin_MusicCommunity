import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"
import WorkshopCard from "../components/cards/WorkshopCard"
import Container from "../components/ui/Container"
import Cover from "../components/ui/Cover"
import PageHero from "../components/ui/PageHero"
import { ChoicePills } from "../components/ui/Field"
import { workshopCategories, workshops } from "../data/content"
import { longDate, money } from "../lib/format"
import { useTitle } from "../lib/useTitle"

export default function Workshops() {
  useTitle("Workshops")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const featured = workshops[0]

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return workshops.filter((workshop) => {
      const matchesQuery =
        !needle ||
        [workshop.title, workshop.instructor, workshop.location, workshop.city, workshop.category].some((value) =>
          value.toLowerCase().includes(needle),
        )
      const matchesCategory = category === "All" || workshop.category === category
      return matchesQuery && matchesCategory
    })
  }, [query, category])

  return (
    <>
      <PageHero
        eyebrow="In the room"
        title="Music workshops"
        subtitle="Short sessions with working players. A schedule, a fee, and a seat count you can trust."
        image="/images/studio.jpg"
      />
      <Container className="py-10">
        <Link to={`/workshops/${featured.id}`} className="grid overflow-hidden rounded-3xl border border-white/10 bg-panel md:grid-cols-2">
          <Cover src={featured.image} alt="" className="h-64 w-full md:h-full" />
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Next workshop</p>
            <h2 className="mt-2 font-display text-3xl text-white">{featured.title}</h2>
            <p className="mt-2 text-sm text-zinc-300">
              {featured.instructor} · {longDate(featured.date)}
            </p>
            <p className="mt-4 text-sm leading-6 text-zinc-400">{featured.summary}</p>
            <p className="mt-4 text-sm text-white">
              {money(featured.fee)} · {featured.seats} seats · {featured.location}
            </p>
          </div>
        </Link>

        <div className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-panel p-4">
          <label className="relative block">
            <span className="sr-only">Search workshops</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search teachers, rooms, topics"
              className="w-full rounded-2xl border border-white/10 bg-ink py-3 pr-3 pl-10 text-sm outline-none focus:border-violet-400/70"
            />
          </label>
          <ChoicePills label="Category" options={["All", ...workshopCategories]} value={category} onChange={setCategory} />
        </div>

        <p className="mt-6 text-sm text-zinc-400">{visible.length} workshops</p>
        {visible.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-white/15 px-6 py-16 text-center text-zinc-300">
            No workshops match that search.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((workshop) => (
              <WorkshopCard key={workshop.id} workshop={workshop} />
            ))}
          </div>
        )}
      </Container>
    </>
  )
}
