import Container from "../components/ui/Container"
import PageHero from "../components/ui/PageHero"
import { announcements } from "../data/content"
import { longDate } from "../lib/format"
import { useTitle } from "../lib/useTitle"

export default function Announcements() {
  useTitle("Announcements")
  const published = announcements.filter((item) => item.status === "Published")

  return (
    <>
      <PageHero
        eyebrow="Updates"
        title="Community announcements"
        subtitle="Published notes from the platform. Reading is open. Posting and replies need a user account."
        image="/images/notes.jpg"
      />
      <Container className="space-y-4 py-10">
        {published.map((item) => (
          <article key={item.id} className="rounded-3xl border border-white/10 bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-violet-300">{item.channel}</p>
            <h2 className="mt-2 font-display text-2xl text-white">{item.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {item.audience} · {longDate(item.date)}
            </p>
          </article>
        ))}
      </Container>
    </>
  )
}
