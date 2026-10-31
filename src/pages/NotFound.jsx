import Button from "../components/ui/Button"
import Container from "../components/ui/Container"
import { useTitle } from "../lib/useTitle"

export default function NotFound() {
  useTitle("Not found")
  return (
    <Container className="py-36 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-violet-300">404</p>
      <h1 className="mt-3 font-display text-4xl text-white">This page left the stage.</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400">The link does not match a room in Harmony.</p>
      <Button to="/" className="mt-6">
        Back home
      </Button>
    </Container>
  )
}
