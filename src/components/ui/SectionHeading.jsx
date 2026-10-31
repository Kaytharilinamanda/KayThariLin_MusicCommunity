export default function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">{eyebrow}</p>
        )}
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-sm leading-6 text-zinc-400 sm:text-base">{description}</p>}
      </div>
      {action}
    </div>
  )
}
