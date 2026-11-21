import {
  BarChart3,
  CalendarDays,
  Drum,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Star,
  Tags,
  Ticket,
  UserRound,
  Users,
} from "lucide-react"
import { useEffect } from "react"
import StudioShell from "./StudioShell"
import { useDeskRows, warmDesk } from "../../lib/deskCache"

const groups = [
  {
    label: "Studio",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/admin/profile", label: "Profile", icon: UserRound },
    ],
  },
  {
    label: "Approvals",
    items: [
      { to: "/admin/events", label: "Events", icon: CalendarDays },
      { to: "/admin/tickets", label: "Tickets", icon: Ticket },
      { to: "/admin/workshops", label: "Workshops", icon: Drum },
      { to: "/admin/courses", label: "Courses", icon: GraduationCap },
      { to: "/admin/categories", label: "Course categories", icon: Tags },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/organizers", label: "Organizers", icon: Users },
    ],
  },
  {
    label: "Community",
    items: [
      { to: "/admin/posts", label: "Community posts", icon: MessageSquare },
      { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { to: "/admin/feedback", label: "Feedback", icon: Star },
    ],
  },
  {
    label: "Insights",
    items: [{ to: "/admin/reports", label: "Reports", icon: BarChart3 }],
  },
]

const warm = [
  "/api/dashboard",
  "/api/events",
  "/api/tickets",
  "/api/programs/workshops",
  "/api/programs/courses",
  "/api/programs/categories",
  "/api/users",
  "/api/posts/manage",
  "/api/announcements/manage",
  "/api/reviews",
  "/api/notifications",
]

export default function AdminLayout() {
  const { rows: notes } = useDeskRows("/api/notifications", "notifications")

  useEffect(() => warmDesk(warm), [])

  return <StudioShell homeTo="/admin" kicker="Admin dashboard" groups={groups} profileTo="/admin/profile" role="Admin" notes={notes} />
}
