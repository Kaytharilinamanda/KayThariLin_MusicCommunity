import Cover from "./Cover"
import Container from "./Container"

export default function PageHero({ eyebrow, title, subtitle, image, ornament, children, compact = false }) {
  return (
    <section className="relative overflow-hidden border-b border-[#f3d6da]">
      {image && <Cover src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.14]" />}
      <div className="absolute inset-0 bg-gradient-to-r from-[#f6f1ea] via-[#f6f1ea]/92 to-[#fff1f2]/75" />
      <Container className={compact ? "relative pt-[5.5rem] pb-6 sm:pt-24 sm:pb-8" : "relative py-16 pt-28 sm:py-20 sm:pt-32"}>
        {ornament && (
          <img
            src={ornament}
            alt=""
            className="pointer-events-none absolute top-28 right-1 h-14 w-10 object-contain sm:top-1/2 sm:right-2 sm:h-36 sm:w-24 sm:-translate-y-1/2"
          />
        )}
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">{eyebrow}</p>
        )}
        <h1 className={`max-w-3xl font-display font-semibold tracking-tight text-white ${compact ? "mt-2 text-4xl" : `text-4xl sm:mt-3 sm:text-5xl ${ornament ? "mt-10" : "mt-3"}`}`}>
          {title}
        </h1>
        {subtitle && <p className={`max-w-2xl text-zinc-300 ${compact ? "mt-2 text-sm leading-6" : "mt-4 text-base leading-7 sm:text-lg"}`}>{subtitle}</p>}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </section>
  )
}
