import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import EventCard from "../components/cards/EventCard"
import Container from "../components/ui/Container"
import EventPoster from "../components/ui/EventPoster"
import PageHero from "../components/ui/PageHero"
import { ChoicePills } from "../components/ui/Field"
import { categories } from "../data/content"
import { cachedRows, loadPublishedEvents, sameCatalog } from "../lib/catalog"
import { dayDistance, isSameMonth, longDate, money } from "../lib/format"
import { useTitle } from "../lib/useTitle"
import { Link } from "react-router-dom"

const dateOptions = ["Any time", "This month", "Next 30 days", "Later"]
const sortOptions = ["Newest", "Soonest", "Latest", "Price: low to high", "Price: high to low"]

export default function Events() {
  useTitle("Events")
  const [events, setEvents] = useState(() => cachedRows("events") || [])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [when, setWhen] = useState("Any time")
  const [sort, setSort] = useState("Newest")

  useEffect(() => {
    loadPublishedEvents().then((rows) => setEvents((current) => (sameCatalog(current, rows) ? current : rows)))
  }, [])

  const featured = events[0]

  const needle = query.trim().toLowerCase()
  const visible = events
    .filter((event) => {
      const matchesQuery =
        !needle ||
        [event.title, event.artist, event.venue, event.city, event.category].some((value) =>
          value.toLowerCase().includes(needle),
        )
      const matchesCategory = category === "All" || event.category === category
      const distance = dayDistance(event.date)
      const matchesDate =
        when === "Any time" ||
        (when === "This month" && isSameMonth(event.date)) ||
        (when === "Next 30 days" && distance >= 0 && distance <= 30) ||
        (when === "Later" && distance > 30)
      return matchesQuery && matchesCategory && matchesDate
    })
    .sort((a, b) => {
      if (sort === "Newest") return 0
      if (sort === "Latest") return b.date.localeCompare(a.date)
      if (sort === "Price: low to high") return a.price - b.price
      if (sort === "Price: high to low") return b.price - a.price
      return a.date.localeCompare(b.date)
    })

  return (
    <>
      <PageHero
        compact
        eyebrow="Calendar"
        title="Music events"
        subtitle="Concerts and club nights with a poster, a room, and a ticket price you can see before you care."
        image="/images/crowd.jpg"
      />
      <Container className="pt-6 pb-10">
        {featured && <Link
          to={`/events/${featured.id}`}
          className="group grid overflow-hidden rounded-3xl border border-white/10 bg-panel lg:grid-cols-[minmax(220px,300px)_1fr]"
        >
          <EventPoster event={featured} className="aspect-[3/4] w-full" />
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Just added</p>
            <h2 className="mt-2 font-display text-3xl text-white">{featured.title}</h2>
            <p className="mt-2 text-sm text-zinc-300">{featured.artist}</p>
            <p className="mt-4 max-w-md text-sm leading-6 text-zinc-400">{featured.blurb}</p>
            <p className="mt-4 text-sm text-white">
              {longDate(featured.date)} · {featured.venue}, {featured.city} · from {money(featured.price)}
            </p>
          </div>
        </Link>}

        <div className="mt-8 space-y-4 rounded-3xl border border-[#f3d6da] bg-raised p-5 shadow-sm">
          <label className="relative block">
            <span className="sr-only">Search events</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search artists, rooms, cities"
              className="w-full rounded-2xl border border-white/10 bg-ink py-3 pr-3 pl-10 text-sm outline-none focus:border-violet-400/70"
            />
          </label>
          <ChoicePills label="Category" options={["All", ...categories]} value={category} onChange={setCategory} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-zinc-400">
              Date
              <select
                value={when}
                onChange={(event) => setWhen(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-ink px-3 py-3 text-sm text-white outline-none"
              >
                {dateOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-zinc-400">
              Sort
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-ink px-3 py-3 text-sm text-white outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="mt-6 text-sm text-zinc-400">{visible.length} concerts</p>
        {visible.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-white/15 px-6 py-16 text-center">
            <p className="font-display text-2xl text-white">No nights match that search.</p>
            <button
              type="button"
              className="mt-3 text-sm text-violet-300"
              onClick={() => {
                setQuery("")
                setCategory("All")
                setWhen("Any time")
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visible.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </Container>
    </>
  )
}
