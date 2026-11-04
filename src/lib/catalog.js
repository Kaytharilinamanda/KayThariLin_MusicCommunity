import { courses as courseCatalog, events as catalog, schools, workshops as workshopCatalog } from "../data/content"
import { api } from "./api"

export async function loadPublishedEvents() {
  try {
    const data = await api("/api/events/public")
    const live = Array.isArray(data.events) ? data.events : []
    const known = new Set(catalog.map((event) => event.id))
    return [...catalog, ...live.filter((event) => event?.id && !known.has(event.id))]
  } catch {
    return catalog
  }
}

function liveWorkshop(item) {
  return {
    id: `live-workshop-${item.id}`,
    title: item.title,
    category: item.category,
    instructor: item.instructor,
    instructorRole: "Instructor",
    avatar: "/avatars/emma.svg",
    date: item.date,
    startTime: item.startTime,
    endTime: item.endTime,
    location: item.location,
    city: item.city,
    fee: Number(item.fee) || 0,
    seats: Number(item.seats) || 0,
    image: "/images/notes.jpg",
    summary: `${item.title} with ${item.instructor}.`,
    description: `${item.instructor} leads ${item.title} at ${item.location}.`,
    learn: [],
  }
}

function liveCourse(item) {
  return {
    id: `live-course-${item.id}`,
    title: item.title,
    instrument: item.instrument,
    level: item.level,
    price: Number(item.price) || 0,
    duration: item.schedule || "",
    schedule: item.schedule || "",
    date: item.date,
    startTime: item.startTime,
    endTime: item.endTime,
    location: item.location,
    instructor: item.instructor,
    avatar: "/avatars/sarah.svg",
    center: item.center,
    centerId: "",
    image: "/images/piano.jpg",
    summary: `${item.title} at ${item.center}.`,
    description: `${item.instructor} teaches ${item.title} at ${item.location}.`,
    includes: [],
    outcomes: [],
  }
}

function liveCenter(item) {
  return {
    id: `live-center-${item.id}`,
    name: item.name,
    city: item.city,
    area: item.area || "",
    address: [item.area, item.city].filter(Boolean).join(", "),
    phone: item.phone || "",
    email: item.email || "",
    hours: item.hours || "",
    image: "/images/studio.jpg",
    focus: item.focus || "",
    blurb: item.focus || item.name,
  }
}

async function loadPublic(path, mapItem, catalogRows) {
  try {
    const data = await api(path)
    const live = (data.items || []).map(mapItem)
    const known = new Set(catalogRows.map((row) => row.id))
    return [...catalogRows, ...live.filter((row) => row?.id && !known.has(row.id))]
  } catch {
    return catalogRows
  }
}

export function loadPublishedWorkshops() {
  return loadPublic("/api/programs/workshops/public", liveWorkshop, workshopCatalog)
}

export function loadPublishedCourses() {
  return loadPublic("/api/programs/courses/public", liveCourse, courseCatalog)
}

export function loadPublishedCenters() {
  return loadPublic("/api/programs/centers/public", liveCenter, schools)
}
