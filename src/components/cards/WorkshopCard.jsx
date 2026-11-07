import { Link } from "react-router-dom"
import { Calendar, MapPin } from "lucide-react"
import Badge from "../ui/Badge"
import Cover from "../ui/Cover"
import { longDate, money, timeRange } from "../../lib/format"

export default function WorkshopCard({ workshop }) {
  return (
    <Link
      to={`/workshops/${workshop.id}`}
      className="group flex h-full min-w-[280px] flex-col overflow-hidden rounded-3xl border border-[#f3d6da] bg-raised shadow-lift transition duration-300 hover:-translate-y-1 hover:border-[#fda4af] hover:shadow-[0_28px_50px_-28px_rgba(159,18,57,0.35)] sm:min-w-0"
    >
      <div className="on-media relative aspect-[16/10] overflow-hidden">
        <Cover src={workshop.image} alt="" className="h-full w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute top-3 left-3">
          <Badge>{workshop.category}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-xl font-semibold text-white">{workshop.title}</h3>
        <p className="mt-2 text-sm text-zinc-400">{workshop.summary}</p>
        <div className="mt-4 flex items-center gap-3">
          <Cover src={workshop.avatar} alt="" className="h-9 w-9 rounded-full" />
          <div>
            <p className="text-sm text-white">{workshop.instructor}</p>
            <p className="text-xs text-zinc-500">{workshop.instructorRole}</p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5 text-sm text-zinc-400">
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-300" />
            {longDate(workshop.date)} · {timeRange(workshop.startTime, workshop.endTime)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-violet-300" />
            {workshop.location}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
          <p className="font-semibold text-white">{money(workshop.fee)}</p>
          <p className="text-xs text-zinc-500">{workshop.seats} seats</p>
        </div>
      </div>
    </Link>
  )
}
