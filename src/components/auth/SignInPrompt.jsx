import Button from "../ui/Button"

export default function SignInPrompt({ title, text, signedIn = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink/70 p-4">
      <p className="font-medium text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-zinc-400">{text}</p>
      {!signedIn && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button to="/login">Login</Button>
          <Button to="/register" variant="secondary">
            Register
          </Button>
        </div>
      )}
    </div>
  )
}
