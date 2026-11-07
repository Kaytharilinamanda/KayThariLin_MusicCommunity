import { courses as courseCatalog, events as catalog, schools, workshops as workshopCatalog } from "../data/content"
import { api } from "./api"

const CACHE_KEY = "harmony-live-catalog"
const memory = {}

function readStore() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function cachedRows(key) {
  if (Array.isArray(memory[key]) && memory[key].length) return memory[key]
  const stored = readStore()[key]
  if (Array.isArray(stored) && stored.length) {
    memory[key] = stored
    return stored
  }
  return null
}

function remember(key, rows) {
  memory[key] = rows
  try {
    const next = { ...readStore(), [key]: rows }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(next))
  } catch {
    // The page still uses the rows from this response.
  }
  return rows
}

export async function loadCached(key, load) {
  try {
    const rows = await load()
    return remember(key, Array.isArray(rows) ? rows : [])
  } catch {
    return cachedRows(key) || []
  }
}

export function sameRows(current, next) {
  if (!Array.isArray(current) || !Array.isArray(next) || current.length !== next.length) return false
  return current.every((item, index) => {
    const other = next[index]
    return item?.id === other?.id && item?.title === other?.title && item?.text === other?.text && item?.likes === other?.likes && item?.time === other?.time && item?.following === other?.following && item?.channel === other?.channel && item?.tag === other?.tag && item?.posts === other?.posts && item?.name === other?.name
  })
}

export function sameCatalog(current, next) {
  if (!Array.isArray(current) || !Array.isArray(next) || current.length !== next.length) return false
  return current.every((item, index) => {
    const other = next[index]
    return item?.id === other?.id && item?.title === other?.title && item?.image === other?.image && item?.date === other?.date && item?.price === other?.price && item?.fee === other?.fee
  })
}

export async function loadPublishedEvents() {
  try {
    const data = await api("/api/events/public")
    return remember("events", Array.isArray(data.events) ? data.events : catalog)
  } catch {
    return cachedRows("events") || catalog
  }
}

function liveWorkshop(item) {
  return {
    ...item,
    id: item.slug || `live-workshop-${item.id}`,
    instructorRole: item.instructorRole || "Instructor",
    avatar: item.avatar || "/avatars/emma.svg",
    image: item.image || "/images/notes.jpg",
    summary: item.summary || `${item.title} with ${item.instructor}.`,
    description: item.description || `${item.instructor} leads ${item.title} at ${item.location}.`,
    learn: item.learn || [],
    fee: Number(item.fee) || 0,
    seats: Number(item.seats) || 0,
  }
}

function liveCourse(item) {
  return {
    ...item,
    id: item.slug || `live-course-${item.id}`,
    price: Number(item.price) || 0,
    duration: item.duration || item.schedule || "",
    schedule: item.schedule || "",
    avatar: item.avatar || "/avatars/sarah.svg",
    centerId: item.centerId || "",
    image: item.image || "/images/piano.jpg",
    summary: item.summary || `${item.title} at ${item.center}.`,
    description: item.description || `${item.instructor} teaches ${item.title} at ${item.location}.`,
    includes: item.includes || [],
    outcomes: item.outcomes || [],
  }
}

function liveCenter(item) {
  return {
    ...item,
    id: item.slug || `live-center-${item.id}`,
    area: item.area || "",
    address: item.address || [item.area, item.city].filter(Boolean).join(", "),
    phone: item.phone || "",
    email: item.email || "",
    hours: item.hours || "",
    image: item.image || "/images/studio.jpg",
    focus: item.focus || "",
    blurb: item.blurb || item.focus || item.name,
  }
}

async function loadPublic(key, path, mapItem, catalogRows) {
  try {
    const data = await api(path)
    return remember(key, Array.isArray(data.items) ? data.items.map(mapItem) : catalogRows)
  } catch {
    return cachedRows(key) || catalogRows
  }
}

export function loadPublishedWorkshops() {
  return loadPublic("workshops", "/api/programs/workshops/public", liveWorkshop, workshopCatalog)
}

export function loadPublishedCourses() {
  return loadPublic("courses", "/api/programs/courses/public", liveCourse, courseCatalog)
}

export function loadPublishedCenters() {
  return loadPublic("centers", "/api/programs/centers/public", liveCenter, schools)
}
