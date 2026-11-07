export default function SectionHeading({ eyebrow, title, description, action, compact = false }) {
  return (
    <div className={compact ? "mb-4 flex flex-wrap items-end justify-between gap-3" : "mb-8 flex flex-wrap items-end justify-between gap-4"}>
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#be123c]">{eyebrow}</p>
        )}
        <h2 className={compact ? "mt-1 font-display text-2xl font-semibold tracking-tight text-[#1c1416]" : "mt-2 font-display text-3xl font-semibold tracking-tight text-[#1c1416] sm:text-4xl"}>{title}</h2>
        {description && <p className={compact ? "mt-1 text-xs leading-5 text-zinc-400" : "mt-3 text-sm leading-6 text-zinc-400 sm:text-base"}>{description}</p>}
      </div>
      {action}
    </div>
  )
}
