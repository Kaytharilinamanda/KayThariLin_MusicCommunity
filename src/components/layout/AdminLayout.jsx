import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
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
import { useEffect, useState } from "react"
import StudioShell from "./StudioShell"
import { api } from "../../lib/api"

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
      { to: "/admin/centers", label: "Music centers", icon: Building2 },
      { to: "/admin/enrollments", label: "Enrollments", icon: ClipboardList },
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

export default function AdminLayout() {
  const [notes, setNotes] = useState([])

  useEffect(() => {
    api("/api/notifications").then((data) => setNotes(data.notifications || [])).catch(() => setNotes([]))
  }, [])

  return <StudioShell homeTo="/admin" kicker="Admin dashboard" groups={groups} profileTo="/admin/profile" role="Admin" notes={notes} />
}
