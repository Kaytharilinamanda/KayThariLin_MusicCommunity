import { Link } from "react-router-dom"
import { Calendar, MapPin } from "lucide-react"
import EventPoster from "../ui/EventPoster"
import { longDate, money } from "../../lib/format"

export default function EventCard({ event }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#f3d6da] bg-raised shadow-lift transition duration-300 hover:-translate-y-1 hover:border-[#fda4af] hover:shadow-[0_28px_50px_-28px_rgba(159,18,57,0.35)]"
    >
      <EventPoster event={event} titleTag="h3" className="aspect-[3/4]" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="flex items-center gap-2 text-sm text-zinc-300">
          <Calendar className="h-4 w-4 text-violet-300" />
          {longDate(event.date)} · {event.time}
        </p>
        <p className="flex items-center gap-2 text-sm text-zinc-400">
          <MapPin className="h-4 w-4 text-violet-300" />
          {event.venue}, {event.city}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="text-sm text-zinc-400">
            From <span className="text-base font-semibold text-white">{money(event.price)}</span>
          </p>
          <span className="text-sm font-medium text-violet-300">Tickets</span>
        </div>
      </div>
    </Link>
  )
}
