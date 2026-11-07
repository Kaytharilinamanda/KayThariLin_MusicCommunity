import { useEffect, useState } from "react"
import { ArrowRight, AudioLines, Disc3, Drum, GraduationCap, Guitar, Headphones, MicVocal, Music2, Music4, Piano, Radio, School } from "lucide-react"
import { Link } from "react-router-dom"
import CourseCard from "../components/cards/CourseCard"
import WorkshopCard from "../components/cards/WorkshopCard"
import SchoolCard from "../components/cards/SchoolCard"
import Button from "../components/ui/Button"
import Container from "../components/ui/Container"
import Cover from "../components/ui/Cover"
import EventPoster from "../components/ui/EventPoster"
import SectionHeading from "../components/ui/SectionHeading"
import { posts, schools } from "../data/content"
import { cachedRows, loadPublishedCourses, loadPublishedEvents, loadPublishedWorkshops, sameCatalog } from "../lib/catalog"
import { useAppState } from "../context/AppState"
import { homeFor, roleLabel } from "../lib/account"
import { longDate, money } from "../lib/format"
import { useTitle } from "../lib/useTitle"

const heroIcons = [
  { Icon: Music2, className: "left-[6%] top-[18%] h-16 w-16 -rotate-12 text-[#fb7185]/35" },
  { Icon: Music4, className: "left-[22%] top-[10%] h-12 w-12 rotate-12 text-[#f59e0b]/30" },
  { Icon: Headphones, className: "left-[4%] top-[62%] h-20 w-20 -rotate-6 text-[#e11d48]/20" },
  { Icon: Radio, className: "left-[28%] top-[68%] h-14 w-14 text-[#fb7185]/25" },
  { Icon: Disc3, className: "left-[48%] top-[8%] h-24 w-24 text-[#e11d48]/20" },
  { Icon: Guitar, className: "right-[18%] top-[12%] h-24 w-24 -rotate-6 text-[#be123c]/20" },
  { Icon: Piano, className: "left-[58%] top-[62%] h-20 w-20 text-[#f59e0b]/25" },
  { Icon: MicVocal, className: "right-[4%] top-[42%] h-24 w-24 text-[#e11d48]/25" },
  { Icon: Drum, className: "right-[16%] top-[58%] h-20 w-20 rotate-6 text-[#fb7185]/30" },
  { Icon: AudioLines, className: "right-[34%] top-[36%] h-14 w-14 -rotate-12 text-[#9f1239]/20" },
]

export default function Home() {
  useTitle("Home")
  const [events, setEvents] = useState(() => cachedRows("events") || [])
  const [courseList, setCourseList] = useState(() => cachedRows("courses") || [])
  const [workshopList, setWorkshopList] = useState(() => cachedRows("workshops") || [])
  const [ready, setReady] = useState(() => Boolean(cachedRows("events")?.length))
  useEffect(() => {
    let active = true
    Promise.all([loadPublishedEvents(), loadPublishedCourses(), loadPublishedWorkshops()]).then(([nextEvents, nextCourses, nextWorkshops]) => {
      if (!active) return
      setEvents((current) => (sameCatalog(current, nextEvents) ? current : nextEvents))
      setCourseList((current) => (sameCatalog(current, nextCourses) ? current : nextCourses))
      setWorkshopList((current) => (sameCatalog(current, nextWorkshops) ? current : nextWorkshops))
      setReady(true)
    })
    return () => {
      active = false
    }
  }, [])
  const nights = events.slice(0, 4)
  const [picked, setPicked] = useState(0)
  const [paused, setPaused] = useState(false)
  const [openPost, setOpenPost] = useState(null)
  const nightIndex = nights.length ? Math.min(picked, nights.length - 1) : 0
  const activeNight = nights[nightIndex]
  const newestCourses = courseList.slice(0, 4)
  const newestWorkshops = workshopList.slice(0, 4)
  const { user } = useAppState()
  const rooms = [
    ["stage", "Nights"],
    ["courses", "Courses"],
    ["workshops", "Workshops"],
    ["community", "Community"],
    ["schools", "Schools"],
  ]

  useEffect(() => {
    if (paused || nights.length < 2) return undefined
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined
    const timer = window.setInterval(() => {
      setPicked((index) => (index + 1) % nights.length)
    }, 4800)
    return () => window.clearInterval(timer)
  }, [paused, nights.length])

  function chooseNight(index) {
    setPicked(index)
  }

  function moveNight(step) {
    if (!nights.length) return
    setPicked((index) => (index + step + nights.length) % nights.length)
  }

  return (
    <>
      <section id="stage" className="relative scroll-mt-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {heroIcons.map(({ Icon, className }, index) => (
            <Icon key={className} className={`hero-drift absolute ${className}`} style={{ animationDelay: `${index * 0.35}s` }} strokeWidth={1.25} />
          ))}
        </div>
        <Container className="relative grid items-start gap-6 pt-20 pb-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:pt-24">
          <div className="w-full">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#fecdd3] bg-raised/90 px-2.5 py-1 text-[11px] font-medium tracking-wide text-[#9f1239] shadow-sm">
                <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
                  {[0, 1, 2].map((bar) => (
                    <span key={bar} className="eq-bar h-3 w-0.5 rounded-full bg-[#e11d48]" style={{ animationDelay: `${bar * 0.15}s` }} />
                  ))}
                </span>
                This season at Harmony
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-[#1c1416] sm:text-5xl">
                Hear it in the room.
                <span className="text-shine mt-1 block">Stay for the people.</span>
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-[#5c464c]">
                {user
                  ? `Signed in as ${roleLabel(user.role)}. Pick a night, then open the room that matches your desk.`
                  : "Welcome. Pick a night below, or jump into workshops, courses, and the notes people leave after the set."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button to="/events" className="px-4 py-2 text-xs">
                  Browse concerts <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                {user ? (
                  <Button to={homeFor(user)} variant="secondary" className="px-4 py-2 text-xs">
                    Open {roleLabel(user.role)} desk
                  </Button>
                ) : (
                  <>
                    <Button to="/login" variant="secondary" className="px-4 py-2 text-xs">
                      Login
                    </Button>
                    <Button to="/register" variant="secondary" className="px-4 py-2 text-xs">
                      Register
                    </Button>
                  </>
                )}
              </div>
              <nav className="mt-4 flex flex-wrap gap-1.5" aria-label="Jump to a room">
                {rooms.map(([id, label]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="rounded-full bg-raised px-3 py-1 text-[11px] font-medium text-[#5c464c] ring-1 ring-[#ead7da] transition duration-200 hover:-translate-y-0.5 hover:bg-[#fff5f6] hover:text-[#9f1239] hover:ring-[#fda4af]"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#be123c]">Latest nights</p>
                <p className="text-[11px] text-zinc-500">{paused ? "Paused" : nights.length > 1 ? "Playing" : "Just added"}</p>
              </div>
              <div
                role="tablist"
                aria-label="Latest nights"
                className="overflow-hidden rounded-2xl border border-[#f3d6da] bg-raised/90"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault()
                    moveNight(1)
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault()
                    moveNight(-1)
                  }
                }}
              >
                {ready && nights.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-400">Concerts will show here in a moment.</p>}
                {!ready && nights.length === 0 && <div className="h-28 animate-pulse bg-white/60" />}
                {nights.map((event, index) => {
                  const selected = index === nightIndex
                  return (
                    <button
                      key={event.id}
                      type="button"
                      role="tab"
                      id={`night-tab-${event.id}`}
                      aria-selected={selected}
                      aria-controls="night-panel"
                      tabIndex={selected ? 0 : -1}
                      onClick={() => chooseNight(index)}
                      className={`grid w-full grid-cols-[4.5rem_1fr] items-center gap-3 border-b border-[#f3d6da] px-3 py-2.5 text-left transition duration-200 last:border-b-0 ${selected ? "bg-[#fff5f6]" : "hover:bg-[#fff5f6]/70"}`}
                    >
                      <EventPoster event={event} variant="compact" className="aspect-[3/4] w-full" />
                      <span className="min-w-0">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-sm font-medium text-white">{event.title}</span>
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${selected ? "bg-[#e11d48]" : "bg-[#e7d5d8]"}`} />
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-zinc-400">
                          {longDate(event.date)} · {event.city} · from {money(event.price)}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <aside
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {activeNight ? (
              <div key={activeNight.id} id="night-panel" role="tabpanel" aria-labelledby={`night-tab-${activeNight.id}`} className="rise-in rounded-3xl border border-[#f3d6da] bg-raised/90 p-3 shadow-sm backdrop-blur-md">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#be123c]">
                    {nightIndex === 0 ? "Just added" : `Night ${nightIndex + 1}`}
                  </p>
                  <p className="text-[11px] text-zinc-500">{activeNight.category}</p>
                </div>
                <EventPoster event={activeNight} className="mx-auto aspect-[3/4] w-full max-w-[210px]" />
                <p className="mt-3 text-sm font-medium text-[#1c1416]">{activeNight.title}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {longDate(activeNight.date)} · {activeNight.city} · from {money(activeNight.price)}
                </p>
                <Button to={`/events/${activeNight.id}`} className="mt-3 w-full px-4 py-2 text-xs">
                  Open this night <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="h-72 animate-pulse rounded-3xl bg-white/60" />
            )}
          </aside>
        </Container>
      </section>

      <section className="relative z-10">
        <Container>
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[#f3d6da] bg-raised shadow-sm md:grid-cols-4">
            {[
              [events.length, "Concerts", "/events", Music2],
              [workshopList.length, "Workshops", "/workshops", Drum],
              [courseList.length, "Courses", "/courses", GraduationCap],
              [schools.length, "Studios", "/courses", School],
            ].map(([value, label, to, Icon]) => (
              <Link key={label} to={to} className="group border-[#f3d6da] px-4 py-3 transition duration-200 hover:bg-[#fff5f6] md:border-l md:first:border-l-0">
                <Icon className="h-3.5 w-3.5 text-[#e11d48] transition duration-200 group-hover:scale-110" />
                <p className="mt-1 font-display text-2xl text-[#9f1239]">{value}</p>
                <p className="flex items-center gap-1 text-xs text-[#6f5960]">
                  {label}
                  <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section id="courses" className="scroll-mt-24 py-10">
        <Container>
          <SectionHeading
            compact
            eyebrow="Study"
            title="New courses"
            description="The latest lessons added. Piano, guitar, voice, and the rooms where those lessons happen."
            action={
              <Button to="/courses" variant="secondary" className="px-3 py-1.5 text-xs">
                All courses
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {newestCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </Container>
      </section>

      <section id="workshops" className="scroll-mt-24 pb-10">
        <Container>
          <SectionHeading
            compact
            eyebrow="Hands on"
            title="New workshops"
            description="The latest sessions added. Small rooms, a fee on the card, and a seat count that is honest."
            action={
              <Button to="/workshops" variant="secondary" className="px-3 py-1.5 text-xs">
                All workshops
              </Button>
            }
          />
          <div className="flex snap-x gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
            {newestWorkshops.map((workshop) => (
              <div key={workshop.id} className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-auto">
                <WorkshopCard workshop={workshop} />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="community" className="scroll-mt-24 pb-10">
        <Container>
          <SectionHeading
            compact
            eyebrow="After the set"
            title="Community highlights"
            description="Notes from players and teachers. The full feed is one room over."
            action={
              <Button to="/community" variant="secondary" className="px-3 py-1.5 text-xs">
                Open the feed
              </Button>
            }
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {posts.slice(0, 3).map((post) => {
              const open = openPost === post.id
              return (
                <button
                  key={post.id}
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenPost((current) => (current === post.id ? null : post.id))}
                  className="rounded-2xl border border-[#f3d6da] bg-raised p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#fda4af] hover:bg-[#fff5f6]"
                >
                  <span className="flex items-center gap-2.5">
                    <Cover src={post.avatar} alt="" className="h-8 w-8 rounded-full" />
                    <span>
                      <span className="block text-sm font-medium text-white">{post.author}</span>
                      <span className="block text-[11px] text-zinc-500">{post.time} · {post.topic}</span>
                    </span>
                  </span>
                  <span className={`mt-2 block text-xs leading-5 text-zinc-400 ${open ? "" : "line-clamp-3"}`}>{post.text}</span>
                  <span className="mt-2 block text-[11px] font-medium text-[#9f1239]">{open ? "Show less" : "Read note"}</span>
                </button>
              )
            })}
          </div>
        </Container>
      </section>

      <section id="schools" className="scroll-mt-24 pb-10">
        <Container>
          <SectionHeading
            compact
            eyebrow="Where to study"
            title="Featured music schools"
            description="Learning rooms with a phone number, a door, and someone who answers it."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {schools.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <div className="grid overflow-hidden rounded-[2rem] border border-[#f3d6da] bg-raised shadow-lift lg:grid-cols-2">
            <div className="relative min-h-64">
              <Cover src="/images/audience.jpg" alt="Audience at a concert" className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-0 bg-violet-950/25" />
            </div>
            <div className="p-8 sm:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">{user ? "Your desk" : "Welcome"}</p>
              <h2 className="mt-2 font-display text-2xl text-white">
                {user ? `${roleLabel(user.role)} tools are on your desk.` : "Look around. Join in after you sign in."}
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {user
                  ? "Events, workshops, courses, and the community stay public. Orders, posts, and enrollments stay on a user account."
                  : "Guests can view events, workshops, courses, announcements, and posts. Tickets, workshop seats, course enrollment, posts, and school messages need a user login."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {user ? (
                  <Button to={homeFor(user)}>Go to {roleLabel(user.role)}</Button>
                ) : (
                  <>
                    <Button to="/login">Login</Button>
                    <Button to="/register" variant="secondary">
                      Create a user account
                    </Button>
                  </>
                )}
                <Button to="/announcements" variant="secondary">
                  Read announcements
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
