import { Mail, MapPin, Phone } from "lucide-react"
import Cover from "../ui/Cover"

export default function SchoolCard({ school, onContact }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-[#f3d6da] bg-raised shadow-lift transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-28px_rgba(159,18,57,0.35)]">
      <div className="relative h-44">
        <Cover src={school.image} alt="" className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-violet-300">{school.city}</p>
        <h3 className="mt-1 font-display text-2xl font-semibold text-white">{school.name}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{school.blurb}</p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-300">
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
            {school.address}
          </li>
          <li className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-violet-300" />
            {school.phone}
          </li>
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-violet-300" />
            {school.email}
          </li>
        </ul>
        <p className="mt-3 text-xs text-zinc-500">{school.hours}</p>
        {onContact && (
          <button
            type="button"
            onClick={() => onContact(school)}
            className="mt-4 text-sm font-semibold text-violet-300 hover:text-violet-200"
          >
            Send a note
          </button>
        )}
      </div>
    </article>
  )
}
