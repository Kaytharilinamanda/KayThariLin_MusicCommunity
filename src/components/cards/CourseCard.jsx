import { Link } from "react-router-dom"
import { AudioLines, BookOpen, Drum, Guitar, Headphones, MicVocal, Music2, Piano } from "lucide-react"
import Badge from "../ui/Badge"
import Cover from "../ui/Cover"
import { schoolById } from "../../data/content"
import { longDate, money, timeRange } from "../../lib/format"

const icons = {
  Piano,
  Guitar,
  Vocals: MicVocal,
  Drums: Drum,
  Violin: Music2,
  Bass: AudioLines,
  "Music Theory": BookOpen,
  "Music Production": Headphones,
}

export default function CourseCard({ course }) {
  const school = schoolById(course.centerId)
  const Icon = icons[course.instrument] || Music2

  return (
    <Link
      to={`/courses/${course.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-panel shadow-lift transition duration-300 hover:-translate-y-1 hover:border-violet-400/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Cover src={course.image} alt="" className="h-full w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge>{course.instrument}</Badge>
          <Badge tone="neutral">{course.level}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-white">{course.title}</h3>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-200">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{course.summary}</p>
        <p className="mt-3 text-xs text-zinc-400">
          {longDate(course.date)} · {timeRange(course.startTime, course.endTime)}
        </p>
        <p className="text-xs text-zinc-500">{course.location}</p>
        <div className="mt-4 flex items-center gap-3">
          <Cover src={course.avatar} alt="" className="h-9 w-9 rounded-full" />
          <div>
            <p className="text-sm text-white">{course.instructor}</p>
            <p className="text-xs text-zinc-500">{school?.name || course.center}</p>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-white/8 pt-3">
          <div>
            <p className="text-lg font-semibold text-white">{money(course.price)}</p>
            <p className="text-xs text-zinc-500">{course.duration}</p>
          </div>
          <p className="text-xs text-zinc-400">{school?.city}</p>
        </div>
      </div>
    </Link>
  )
}
