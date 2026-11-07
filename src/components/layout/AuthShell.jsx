import { Link } from "react-router-dom"
import Cover from "../ui/Cover"

export default function AuthShell({ image, imageClass = "", quote, quoteBy, title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="on-media relative min-h-72 lg:min-h-svh">
        <Cover src={image} alt="" className={`absolute inset-0 h-full w-full ${imageClass}`} />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#1c1416]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <p className="max-w-md font-display text-2xl leading-snug text-white sm:text-3xl">{quote}</p>
          <p className="mt-3 text-sm text-violet-200">{quoteBy}</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-[#f6f1ea] px-4 py-16 sm:px-8 lg:py-28">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex text-sm text-[#6f5960] transition hover:text-[#9f1239] lg:hidden">
            ← Back to Harmony
          </Link>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-zinc-400">{footer}</div>
        </div>
      </div>
    </div>
  )
}
