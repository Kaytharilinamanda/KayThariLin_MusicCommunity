import Cover from "./Cover"
import Container from "./Container"

export default function PageHero({ eyebrow, title, subtitle, image, ornament, children }) {
  return (
    <section className="on-media relative overflow-hidden border-b border-white/10">
      {image && <Cover src={image} alt="" className="absolute inset-0 h-full w-full opacity-40" />}
      <div className="absolute inset-0 bg-gradient-to-r from-scrim via-scrim/92 to-scrim/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-scrim via-transparent to-scrim/50" />
      <Container className="relative py-16 pt-28 sm:py-20 sm:pt-32">
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
        <h1 className={`max-w-3xl font-display text-4xl font-semibold tracking-tight text-white sm:mt-3 sm:text-5xl ${ornament ? "mt-10" : "mt-3"}`}>
          {title}
        </h1>
        {subtitle && <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">{subtitle}</p>}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </section>
  )
}
