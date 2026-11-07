import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Navbar from "./Navbar"
import Footer from "./Footer"

export default function PublicLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="relative min-h-svh bg-transparent text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] overflow-hidden">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#fecdd3]/70 blur-3xl" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-[#fde68a]/60 blur-3xl" />
      </div>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
