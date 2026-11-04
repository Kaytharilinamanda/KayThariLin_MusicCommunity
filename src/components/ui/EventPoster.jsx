import Cover from "./Cover"
import { cn } from "../../lib/format"

function posterDate(iso) {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return { weekday: "", month: "", day: "", year: "" }
  }
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(date.getDate()).padStart(2, "0"),
    year: String(date.getFullYear()),
  }
}

const type = {
  card: {
    artist: "text-[13px] tracking-[0.08em]",
    title: "text-[2.15rem] leading-[0.86] sm:text-[2.6rem]",
    date: "text-4xl",
    meta: "text-[11px]",
    pad: "p-4",
    rule: "inset-2.5",
  },
  billboard: {
    artist: "text-sm tracking-[0.1em] sm:text-base",
    title: "text-5xl leading-[0.84] sm:text-6xl",
    date: "text-5xl",
    meta: "text-sm",
    pad: "p-5 sm:p-7",
    rule: "inset-3 sm:inset-4",
  },
  compact: {
    artist: "text-[9px] tracking-[0.06em]",
    title: "text-[1.15rem] leading-[0.88]",
    date: "text-xl",
    meta: "text-[8px]",
    pad: "p-2",
    rule: "inset-1.5",
  },
}

export default function EventPoster({ event, className = "", variant = "card", titleTag: Title = "p" }) {
  const size = type[variant] || type.card
  const when = posterDate(event.date)
  const paper = variant === "compact" ? "p-1" : variant === "billboard" ? "p-2 sm:p-2.5" : "p-1.5"

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("relative h-full overflow-hidden bg-[#f4efe6]", paper)}>
        <div className="on-media relative h-full overflow-hidden bg-scrim">
            <Cover
            src={event.image}
            alt={event.artist}
            className={cn(
              "absolute w-full object-cover",
              event.imageClass || "inset-0 h-full object-[center_22%]",
            )}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0.05)_16%,rgba(0,0,0,0.02)_42%,rgba(0,0,0,0.55)_68%,rgba(0,0,0,0.92)_100%)]" />
          <div className={cn("pointer-events-none absolute border border-white/80", size.rule)} />
          <div
            className={cn(
              "relative flex h-full flex-col justify-between text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.85)]",
              size.pad,
            )}
          >
            <div className="flex items-start justify-between gap-2">
              {variant === "compact" ? (
                <p className="text-[8px] font-semibold tracking-[0.18em] text-white">{event.category.toUpperCase()}</p>
              ) : (
                <>
                  <p className="text-[10px] font-semibold tracking-[0.28em] text-[#f4efe6] sm:text-[11px]">HARMONY PRESENTS</p>
                  <p className="text-[10px] font-semibold tracking-[0.22em] text-violet-200 sm:text-[11px]">
                    {event.category.toUpperCase()}
                  </p>
                </>
              )}
            </div>

            <div>
              <p className={cn("font-semibold leading-tight text-violet-100 uppercase", size.artist)}>{event.artist}</p>
              <Title className={cn("mt-1 font-poster text-white uppercase", size.title)}>{event.title}</Title>
              <div className="mt-2 h-0.5 w-10 bg-violet-500" />
              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="shrink-0">
                  <p className={cn("font-semibold tracking-[0.16em]", size.meta)}>{when.weekday}</p>
                  <p className={cn("font-poster leading-none", size.date)}>
                    {when.month} {when.day}
                  </p>
                  <p className={cn("tracking-[0.16em] text-white/80", size.meta)}>{when.year}</p>
                </div>
                <div className="min-w-0 text-right">
                  <p className={cn("font-semibold", size.meta)}>{event.time}</p>
                  <p className={cn("mt-1 font-medium", size.meta)}>{event.venue}</p>
                  <p className={cn("tracking-[0.16em] text-white/75 uppercase", size.meta)}>{event.city}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
