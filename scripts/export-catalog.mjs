import { writeFileSync } from "node:fs"
import {
  announcements,
  courses,
  enrollments,
  events,
  instruments,
  members,
  orders,
  posts,
  schools,
  topics,
  workshops,
} from "../src/data/content.js"

writeFileSync(
  new URL("../laravel/database/seeders/catalog.json", import.meta.url),
  JSON.stringify({ announcements, courses, enrollments, events, instruments, members, orders, posts, schools, topics, workshops }),
)
console.log("catalog.json written")
