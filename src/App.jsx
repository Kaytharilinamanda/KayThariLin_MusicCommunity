import { Route, Routes } from "react-router-dom"
import PublicLayout from "./components/layout/PublicLayout"
import AdminLayout from "./components/layout/AdminLayout"
import Home from "./pages/Home"
import Events from "./pages/Events"
import EventDetail from "./pages/EventDetail"
import Workshops from "./pages/Workshops"
import WorkshopDetail from "./pages/WorkshopDetail"
import Courses from "./pages/Courses"
import CourseDetail from "./pages/CourseDetail"
import Community from "./pages/Community"
import Announcements from "./pages/Announcements"
import Login from "./pages/Login"
import Register from "./pages/Register"
import NotFound from "./pages/NotFound"
import RequireAuth from "./components/auth/RequireAuth"
import { AccountCourses, AccountFeedback, AccountLayout, AccountOrders, AccountProfile, AccountWorkshops } from "./pages/account/AccountPages"
import {
  OrganizerAds,
  OrganizerAnnouncements,
  OrganizerEnquiries,
  OrganizerEvents,
  OrganizerHome,
  OrganizerLayout,
  OrganizerOrders,
  OrganizerProfile,
  OrganizerReports,
  OrganizerTicketSetup,
} from "./pages/organizer/OrganizerPages"
import {
  OrganizerCategories,
  OrganizerCenters,
  OrganizerCourses,
  OrganizerEnrollments,
  OrganizerWorkshops,
} from "./pages/organizer/ProgramPages"
import Dashboard from "./pages/admin/Dashboard"
import ManageEvents from "./pages/admin/ManageEvents"
import ManageTickets from "./pages/admin/ManageTickets"
import ManageWorkshops from "./pages/admin/ManageWorkshops"
import ManageCourses from "./pages/admin/ManageCourses"
import ManageCenters from "./pages/admin/ManageCenters"
import ManageEnrollments from "./pages/admin/ManageEnrollments"
import ManageUsers from "./pages/admin/ManageUsers"
import ManageOrganizers from "./pages/admin/ManageOrganizers"
import ManagePosts from "./pages/admin/ManagePosts"
import ManageAnnouncements from "./pages/admin/ManageAnnouncements"
import { AdminProfile, ManageCategories, ManageFeedback, ManageReports } from "./pages/admin/ExtraDesks"

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="workshops" element={<Workshops />} />
        <Route path="workshops/:id" element={<WorkshopDetail />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="community" element={<Community />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="account"
          element={
            <RequireAuth role="user">
              <AccountLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AccountProfile />} />
          <Route path="orders" element={<AccountOrders />} />
          <Route path="workshops" element={<AccountWorkshops />} />
          <Route path="courses" element={<AccountCourses />} />
          <Route path="feedback" element={<AccountFeedback />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route
        path="organizer"
        element={
          <RequireAuth role="organizer">
            <OrganizerLayout />
          </RequireAuth>
        }
      >
        <Route index element={<OrganizerHome />} />
        <Route path="profile" element={<OrganizerProfile />} />
        <Route path="events" element={<OrganizerEvents />} />
        <Route path="announcements" element={<OrganizerAnnouncements />} />
        <Route path="ads" element={<OrganizerAds />} />
        <Route path="tickets" element={<OrganizerTicketSetup />} />
        <Route path="workshops" element={<OrganizerWorkshops />} />
        <Route path="courses" element={<OrganizerCourses />} />
        <Route path="categories" element={<OrganizerCategories />} />
        <Route path="centers" element={<OrganizerCenters />} />
        <Route path="enrollments" element={<OrganizerEnrollments />} />
        <Route path="orders" element={<OrganizerOrders />} />
        <Route path="enquiries" element={<OrganizerEnquiries />} />
        <Route path="reports" element={<OrganizerReports />} />
      </Route>
      <Route
        path="admin"
        element={
          <RequireAuth role="admin">
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="events" element={<ManageEvents />} />
        <Route path="tickets" element={<ManageTickets />} />
        <Route path="workshops" element={<ManageWorkshops />} />
        <Route path="courses" element={<ManageCourses />} />
        <Route path="centers" element={<ManageCenters />} />
        <Route path="enrollments" element={<ManageEnrollments />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="organizers" element={<ManageOrganizers />} />
        <Route path="posts" element={<ManagePosts />} />
        <Route path="announcements" element={<ManageAnnouncements />} />
        <Route path="feedback" element={<ManageFeedback />} />
        <Route path="categories" element={<ManageCategories />} />
        <Route path="reports" element={<ManageReports />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
