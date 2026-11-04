import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Check, Clock, MapPin } from "lucide-react"
import Button from "../components/ui/Button"
import Container from "../components/ui/Container"
import Cover from "../components/ui/Cover"
import { SelectField, TextArea, TextField } from "../components/ui/Field"
import { courses as catalogCourses, schoolById } from "../data/content"
import { loadPublishedCourses } from "../lib/catalog"
import { useAppState } from "../context/AppState"
import { userGate } from "../lib/account"
import SignInPrompt from "../components/auth/SignInPrompt"
import { longDate, money, timeRange } from "../lib/format"
import { useTitle } from "../lib/useTitle"

export default function CourseDetail() {
  const { id } = useParams()
  const [courses, setCourses] = useState(catalogCourses)
  const [ready, setReady] = useState(catalogCourses.some((item) => item.id === id))
  const course = courses.find((item) => item.id === id)
  const school = course
    ? schoolById(course.centerId) || {
        name: course.center || "Studio",
        city: "",
        area: "",
        address: course.location || "",
        phone: "",
        email: "",
        hours: "",
        image: course.image || "/images/piano-hall.jpg",
        focus: course.instrument || "",
      }
    : null
  useTitle(course?.title || "Course")

  useEffect(() => {
    let active = true
    loadPublishedCourses()
      .then((rows) => {
        if (active) setCourses(rows)
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [id])
  const [form, setForm] = useState({ name: "", email: "", phone: "", start: "Next intake", message: "" })
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(false)
  const { notify, user, addBooking } = useAppState()
  const navigate = useNavigate()

  if (!ready) {
    return (
      <Container className="py-32 text-center">
        <p className="text-zinc-400">Loading this course.</p>
      </Container>
    )
  }

  if (!course || !school) {
    return (
      <Container className="py-32 text-center">
        <h1 className="font-display text-4xl text-white">That course is not listed.</h1>
        <Button to="/courses" className="mt-6">
          Back to courses
        </Button>
      </Container>
    )
  }

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submit(event) {
    event.preventDefault()
    if (!userGate(user, navigate, notify, `/courses/${course.id}`)) return
    const next = {}
    if (form.name.trim().length < 2) next.name = "Add your name."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Use a valid email address."
    if (form.phone.trim().length < 6) next.phone = "Add a phone number."
    setErrors(next)
    if (Object.keys(next).length) return
    addBooking("courses", {
      id: `EN-${Date.now().toString().slice(-6)}`,
      title: course.title,
      center: school.name,
      status: "Pending",
      date: new Date().toISOString().slice(0, 10),
    })
    if (form.message.trim()) {
      addBooking("reviews", {
        id: `Q-${Date.now().toString().slice(-6)}`,
        target: course.title,
        kind: "Course",
        rating: 0,
        text: form.message.trim(),
        date: new Date().toISOString().slice(0, 10),
      })
    }
    setDone(true)
    notify("Enrollment request saved under your account.")
  }

  return (
    <article>
      <section className="relative min-h-[58vh]">
        <Cover src={course.image} alt="" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/65 to-ink/25" />
        <Container className="relative flex min-h-[58vh] flex-col justify-end pt-28 pb-10">
          <Link to="/courses" className="mb-6 text-sm text-zinc-300 hover:text-white">
            ← All courses
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
            {course.instrument} · {course.level}
          </p>
          <h1 className="mt-3 font-display text-4xl text-white sm:text-6xl">{course.title}</h1>
          <p className="mt-3 text-zinc-200">
            {course.instructor} · {school.name}
          </p>
        </Container>
      </section>
      <Container className="grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="max-w-2xl text-base leading-7 text-zinc-300">{course.description}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-panel p-4 text-sm text-zinc-200">
              <Clock className="mb-2 h-4 w-4 text-violet-300" />
              {longDate(course.date)}
              <p className="mt-1 text-zinc-100">{timeRange(course.startTime, course.endTime)}</p>
              <p className="mt-1 text-xs text-zinc-500">{course.schedule} · {course.duration}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-panel p-4 text-sm text-zinc-200">
              <MapPin className="mb-2 h-4 w-4 text-violet-300" />
              {course.location}
              <p className="mt-1 text-xs text-zinc-500">{school.name} · {school.city}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-panel p-4">
              <p className="text-xs text-zinc-500">Tuition</p>
              <p className="font-display text-3xl text-white">{money(course.price)}</p>
            </div>
          </div>
          <h2 className="mt-8 font-display text-2xl text-white">Included</h2>
          <ul className="mt-4 space-y-3">
            {(course.includes || []).map((item) => (
              <li key={item} className="flex gap-3 text-sm text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 text-violet-300" />
                {item}
              </li>
            ))}
          </ul>
          <h2 className="mt-8 font-display text-2xl text-white">By the end</h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {(course.outcomes || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-panel">
            <Cover src={school.image} alt="" className="h-44 w-full" />
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-violet-300">Learning center</p>
              <h3 className="mt-1 font-display text-2xl text-white">{school.name}</h3>
              <p className="mt-2 text-sm text-zinc-400">{school.address}</p>
              <p className="mt-2 text-sm text-zinc-300">{school.phone}</p>
              <p className="text-sm text-zinc-300">{school.email}</p>
              <p className="mt-2 text-xs text-zinc-500">{school.hours}</p>
            </div>
          </div>
        </div>
        <aside className="h-fit rounded-3xl border border-white/10 bg-panel p-5 shadow-lift lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <Cover src={course.avatar} alt="" className="h-12 w-12 rounded-full" />
            <div>
              <p className="text-white">{course.instructor}</p>
              <p className="text-xs text-zinc-500">Instructor</p>
            </div>
          </div>
          {done ? (
            <p className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              Enrollment request noted for {course.title}. It is listed under your account, and the note reaches the learning center on this page.
            </p>
          ) : user?.role !== "user" ? (
            <div className="mt-5">
              <SignInPrompt
                signedIn={Boolean(user)}
                title="Sign in to enroll or enquire"
                text="Fees, schedules, and the learning center stay visible. Enrollment and messages use a user account."
              />
            </div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={submit}>
              <h2 className="font-display text-2xl text-white">Enroll</h2>
              <TextField id="en-name" label="Full name" value={form.name} error={errors.name} onChange={(event) => update("name", event.target.value)} />
              <TextField id="en-email" type="email" label="Email" value={form.email} error={errors.email} onChange={(event) => update("email", event.target.value)} />
              <TextField id="en-phone" type="tel" label="Phone" value={form.phone} error={errors.phone} onChange={(event) => update("phone", event.target.value)} />
              <SelectField id="en-start" label="Preferred start" value={form.start} onChange={(event) => update("start", event.target.value)}>
                <option>Next intake</option>
                <option>The intake after</option>
              </SelectField>
              <TextArea id="en-message" label="Note to the studio" value={form.message} onChange={(event) => update("message", event.target.value)} />
              <Button type="submit" className="w-full">
                Request enrollment
              </Button>
            </form>
          )}
        </aside>
      </Container>
    </article>
  )
}
