import { useEffect, useState } from "react"
import { ArrowRight, AudioLines, Disc3, Drum, Guitar, Headphones, MicVocal, Music2, Music4, Piano, Radio, Speaker } from "lucide-react"
import { Link } from "react-router-dom"
import CourseCard from "../components/cards/CourseCard"
import WorkshopCard from "../components/cards/WorkshopCard"
import SchoolCard from "../components/cards/SchoolCard"
import Button from "../components/ui/Button"
import Container from "../components/ui/Container"
import Cover from "../components/ui/Cover"
import EventPoster from "../components/ui/EventPoster"
import SectionHeading from "../components/ui/SectionHeading"
import { courses, events as catalogEvents, posts, schools, workshops } from "../data/content"
import { loadPublishedEvents } from "../lib/catalog"
import { useAppState } from "../context/AppState"
import { homeFor, roleLabel } from "../lib/account"
import { longDate, money } from "../lib/format"
import { useTitle } from "../lib/useTitle"

const heroIcons = [
  { Icon: Music2, className: "left-[8%] top-[16%] h-20 w-20 -rotate-12 text-violet-100/40" },
  { Icon: Music4, className: "left-[26%] top-[12%] h-14 w-14 rotate-12 text-violet-100/30" },
  { Icon: Headphones, className: "left-[5%] top-[58%] h-24 w-24 -rotate-6 text-violet-100/30" },
  { Icon: Radio, className: "left-[30%] top-[66%] h-16 w-16 text-violet-100/28" },
  { Icon: Disc3, className: "left-[54%] top-[12%] h-32 w-32 text-violet-100/70" },
  { Icon: Music2, className: "right-[7%] top-[8%] h-44 w-44 rotate-12 text-violet-100/75" },
  { Icon: Guitar, className: "right-[26%] top-[14%] h-28 w-28 -rotate-6 text-violet-100/65" },
  { Icon: Piano, className: "left-[48%] top-[58%] h-24 w-24 text-violet-100/55" },
  { Icon: Speaker, className: "left-[42%] top-[24%] h-16 w-16 text-violet-100/40" },
  { Icon: MicVocal, className: "right-[3%] top-[46%] h-28 w-28 text-violet-100/65" },
  { Icon: Drum, className: "right-[16%] top-[60%] h-24 w-24 rotate-6 text-violet-100/55" },
  { Icon: Headphones, className: "right-[5%] top-[26%] h-20 w-20 rotate-12 text-violet-100/50" },
  { Icon: AudioLines, className: "left-[60%] top-[70%] h-16 w-16 text-violet-100/45" },
  { Icon: Music4, className: "right-[34%] top-[42%] h-16 w-16 -rotate-12 text-violet-100/50" },
]

export default function Home() {
  useTitle("Home")
  const [events, setEvents] = useState(catalogEvents)
  useEffect(() => {
    loadPublishedEvents().then(setEvents)
  }, [])
  const next = [...events].sort((a, b) => a.date.localeCompare(b.date))[0]
  const featured = events.filter((event) => event.featured)
  const spotlight = featured[0]
  const sideEvents = events.filter((event) => event.id !== spotlight.id).slice(0, 3)
  const { user } = useAppState()

  return (
    <>
      <section className="on-media relative min-h-svh overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_74%_42%,rgba(180,35,52,0.42),transparent_48%)]" />
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {heroIcons.map(({ Icon, className }) => (
            <Icon key={className} className={`absolute ${className}`} strokeWidth={1.25} />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-scrim via-scrim/80 to-scrim/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-scrim via-transparent to-scrim/20" />
        <Container className="relative grid min-h-svh items-center gap-10 py-28 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="w-full">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs tracking-wide text-violet-100 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                This season at Harmony
              </p>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Hear it in the room.
                <span className="text-shine mt-2 block">Stay for the people.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-zinc-200 sm:text-lg">
                {user
                  ? `Signed in as ${roleLabel(user.role)}. Browse the public rooms, or open your desk to manage what your role can do.`
                  : "Welcome. You can look through concerts, workshops, courses, and announcements. Booking, registering, posting, and contacting a school start after you sign in."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button to="/events">
                  Browse concerts <ArrowRight className="h-4 w-4" />
                </Button>
                {user ? (
                  <Button to={homeFor(user)} variant="secondary">
                    Open {roleLabel(user.role)} desk
                  </Button>
                ) : (
                  <>
                    <Button to="/login" variant="secondary">
                      Login
                    </Button>
                    <Button to="/register" variant="secondary">
                      Register
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          <aside className="hidden lg:block">
              <Link
                to={`/events/${next.id}`}
                className="group block rounded-3xl border border-white/15 bg-black/45 p-3 shadow-lift backdrop-blur-md transition hover:border-violet-300/40"
              >
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">Next on stage</p>
                <EventPoster event={next} className="mx-auto aspect-[3/4] w-full max-w-[280px]" />
                <p className="mt-3 text-sm text-white">Tickets from {money(next.price)}</p>
              </Link>
            </aside>
        </Container>
      </section>

      <section className="relative z-10 -mt-8">
        <Container>
          <dl className="grid grid-cols-2 overflow-hidden rounded-3xl border border-white/10 bg-panel/95 shadow-lift backdrop-blur md:grid-cols-4">
            {[
              [events.length, "Concerts on the calendar"],
              [workshops.length, "Workshops open"],
              [courses.length, "Courses enrolling"],
              [schools.length, "Music studios"],
            ].map(([value, label]) => (
              <div key={label} className="border-white/10 px-5 py-5 md:border-l first:border-l-0">
                <dt className="font-display text-3xl text-white">{value}</dt>
                <dd className="mt-1 text-sm text-zinc-400">{label}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="On stage"
            title="Featured nights"
            description="A few rooms worth leaving the house for. Posters, dates, and the price of a decent seat."
            action={
              <Button to="/events" variant="secondary">
                All events
              </Button>
            }
          />
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(260px,380px)_1fr]">
            <Link to={`/events/${spotlight.id}`} className="group block">
              <EventPoster event={spotlight} variant="billboard" titleTag="h3" className="aspect-[3/4] w-full shadow-lift" />
              <p className="mt-3 max-w-md text-sm leading-6 text-zinc-300">{spotlight.blurb}</p>
              <p className="mt-2 text-sm text-white">From {money(spotlight.price)}</p>
            </Link>
            <div className="grid gap-4">
              {sideEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="group grid grid-cols-[148px_1fr] items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-panel p-2 transition hover:border-violet-400/40"
                >
                  <EventPoster event={event} variant="compact" className="aspect-[3/4] w-full" />
                  <div className="py-1 pr-2">
                    <p className="text-xs text-violet-300">{event.category}</p>
                    <h3 className="font-display text-lg text-white">{event.title}</h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      {longDate(event.date)} · {event.city}
                    </p>
                    <p className="mt-2 text-sm text-white">From {money(event.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="pb-16 sm:pb-24">
        <Container>
          <SectionHeading
            eyebrow="Study"
            title="Popular courses"
            description="Piano, guitar, voice, and the rooms where those lessons actually happen."
            action={
              <Button to="/courses" variant="secondary">
                All courses
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {courses.filter((course) => course.popular).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-16 sm:pb-24">
        <Container>
          <SectionHeading
            eyebrow="Hands on"
            title="Upcoming workshops"
            description="Half-days with working players. Small rooms, a fee on the card, and a seat count that is honest."
            action={
              <Button to="/workshops" variant="secondary">
                All workshops
              </Button>
            }
          />
          <div className="flex snap-x gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
            {workshops.slice(0, 4).map((workshop) => (
              <div key={workshop.id} className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-auto">
                <WorkshopCard workshop={workshop} />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-16 sm:pb-24">
        <Container>
          <SectionHeading
            eyebrow="After the set"
            title="Community highlights"
            description="Notes from players and teachers. The full feed is one room over."
            action={
              <Button to="/community" variant="secondary">
                Open the feed
              </Button>
            }
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {posts.slice(0, 3).map((post) => (
              <article key={post.id} className="rounded-3xl border border-white/10 bg-panel p-5">
                <div className="flex items-center gap-3">
                  <Cover src={post.avatar} alt="" className="h-11 w-11 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-white">{post.author}</p>
                    <p className="text-xs text-zinc-500">{post.time} · {post.topic}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-300">{post.text}</p>
                {post.image && <Cover src={post.image} alt="" className="mt-4 h-40 w-full rounded-2xl" />}
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-16 sm:pb-24">
        <Container>
          <SectionHeading
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
          <div className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-panel lg:grid-cols-2">
            <div className="relative min-h-64">
              <Cover src="/images/audience.jpg" alt="Audience at a concert" className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-0 bg-violet-950/25" />
            </div>
            <div className="p-8 sm:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">{user ? "Your desk" : "Welcome"}</p>
              <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
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
