import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { createServer } from "node:http"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import mysql from "mysql2/promise"

const root = dirname(fileURLToPath(import.meta.url))
const database = process.env.MYSQL_DATABASE || "music_community"
const dbConfig = {
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD ?? "",
}

const secret = "harmony-account-secret"
const adminEmail = "admin@harmony.community"
const adminPassword = "HarmonyAdmin1"

let pool
let ready

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 32).toString("hex")
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":")
  if (!salt || !hash) return false
  const actual = scryptSync(password, salt, 32)
  const expected = Buffer.from(hash, "hex")
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params)
  return rows
}

async function ensureDb() {
  if (pool) return
  const connection = await mysql.createConnection({ ...dbConfig, multipleStatements: true })
  await connection.query(readFileSync(join(root, "schema.sql"), "utf8"))
  await connection.end()
  pool = mysql.createPool({ ...dbConfig, database, waitForConnections: true, connectionLimit: 10 })
  const existing = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
  if (!existing.length) {
    await query(
      `INSERT INTO users (name, email, password_hash, role, status, city, organization)
       VALUES (?, ?, ?, 'admin', 'active', 'Yangon', 'Harmony')`,
      ["Harmony Admin", adminEmail, hashPassword(adminPassword)],
    )
  }
}

function ensureDbOnce() {
  if (!ready) {
    ready = ensureDb().catch((error) => {
      ready = null
      pool = null
      throw error
    })
  }
  return ready
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    phone: row.phone,
    city: row.city,
    organization: row.organization,
  }
}

function signToken(user) {
  const body = Buffer.from(JSON.stringify({ id: user.id, exp: Date.now() + 7 * 86400000 })).toString("base64url")
  const signature = createHmac("sha256", secret).update(body).digest("base64url")
  return `${body}.${signature}`
}

async function userFromToken(header = "") {
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  const [body, signature] = token.split(".")
  if (!body || !signature) return null
  const expected = createHmac("sha256", secret).update(body).digest("base64url")
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  let payload
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString())
  } catch {
    return null
  }
  if (!payload?.id || payload.exp < Date.now()) return null
  const rows = await query("SELECT * FROM users WHERE id = ?", [payload.id])
  return rows[0] || null
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString()
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(Object.assign(new Error("Send account details as JSON."), { status: 400 }))
      }
    })
    req.on("error", reject)
  })
}

function send(res, status, payload) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(payload))
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function registerAccount(body) {
  const name = String(body.name || "").trim()
  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "")
  const role = body.role === "organizer" ? "organizer" : body.role === "user" ? "user" : ""
  const phone = String(body.phone || "").trim()
  const city = String(body.city || "").trim()
  const organization = String(body.organization || "").trim()

  if (name.length < 2) throw Object.assign(new Error("Add your name."), { status: 400 })
  if (!emailPattern.test(email)) throw Object.assign(new Error("Enter a valid email address."), { status: 400 })
  if (password.length < 8) throw Object.assign(new Error("Use at least 8 characters."), { status: 400 })
  if (!role) throw Object.assign(new Error("Choose a user or organizer account. Admin is not open for registration."), { status: 400 })
  if (email === adminEmail) throw Object.assign(new Error("That email is reserved for the studio admin."), { status: 400 })
  if (role === "organizer" && organization.length < 2) {
    throw Object.assign(new Error("Add the organizer or company name."), { status: 400 })
  }

  const taken = await query("SELECT id FROM users WHERE email = ?", [email])
  if (taken.length) throw Object.assign(new Error("An account with that email already exists."), { status: 409 })

  const status = role === "organizer" ? "pending" : "active"
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, status, phone, city, organization)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, hashPassword(password), role, status, phone, city, organization],
  )
  const rows = await query("SELECT * FROM users WHERE id = ?", [result.insertId])
  const user = rows[0]
  return { token: signToken(user), user: publicUser(user) }
}

async function loginAccount(body) {
  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "")
  const role = body.role
  const rows = await query("SELECT * FROM users WHERE email = ?", [email])
  const user = rows[0]
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw Object.assign(new Error("Email or password is incorrect."), { status: 401 })
  }
  if (role && user.role !== role) {
    const labels = { user: "user", organizer: "organizer", admin: "admin" }
    throw Object.assign(new Error(`This email is a ${labels[user.role] || user.role} account.`), { status: 403 })
  }
  if (user.status === "suspended") throw Object.assign(new Error("This account is suspended."), { status: 403 })
  if (user.status === "rejected") throw Object.assign(new Error("This organizer registration was not approved."), { status: 403 })
  return { token: signToken(user), user: publicUser(user) }
}

async function updateStatus(actor, id, status) {
  if (!actor || actor.role !== "admin") throw Object.assign(new Error("Only the admin can change account status."), { status: 403 })
  if (!["active", "pending", "suspended", "rejected"].includes(status)) {
    throw Object.assign(new Error("That status is not available."), { status: 400 })
  }
  const found = await query("SELECT * FROM users WHERE id = ?", [id])
  const target = found[0]
  if (!target) throw Object.assign(new Error("That account was not found."), { status: 404 })
  if (target.role === "admin") throw Object.assign(new Error("The studio admin account stays active."), { status: 400 })
  await query("UPDATE users SET status = ? WHERE id = ?", [status, id])
  const rows = await query("SELECT * FROM users WHERE id = ?", [id])
  return publicUser(rows[0])
}

const eventCategories = ["Pop", "Hip-Hop", "R&B", "Rock"]

function fail(message, status) {
  throw Object.assign(new Error(message), { status })
}

function requireAdmin(actor) {
  if (!actor) fail("Sign in again.", 401)
  if (actor.role !== "admin") fail("Only the admin can do that.", 403)
}

function requireOrganizer(actor) {
  if (!actor) fail("Sign in again.", 401)
  if (actor.role !== "organizer") fail("Only an organizer can change events and tickets.", 403)
  if (actor.status === "suspended" || actor.status === "rejected") {
    fail("This organizer account cannot submit changes.", 403)
  }
}

function labelStatus(value) {
  if (value === "approved") return "Approved"
  if (value === "rejected") return "Rejected"
  return "Pending"
}

function dateOrNull(value, label) {
  const text = String(value || "").trim()
  if (!text) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) fail(`Enter a valid ${label}.`, 400)
  return text
}

function readEvent(body) {
  const title = String(body.title || "").trim()
  const artist = String(body.artist || "").trim()
  const category = eventCategories.includes(body.category) ? body.category : ""
  const eventDate = dateOrNull(body.date, "date")
  const eventTime = String(body.time || "").trim()
  const venue = String(body.venue || "").trim()
  const city = String(body.city || "").trim()
  const address = String(body.address || "").trim()
  const blurb = String(body.blurb || "").trim().slice(0, 500)
  const price = Number(body.price)
  if (title.length < 2) fail("Add an event title.", 400)
  if (artist.length < 2) fail("Add the artist.", 400)
  if (!category) fail("Choose a category.", 400)
  if (!eventDate) fail("Add the event date.", 400)
  if (!eventTime) fail("Add the start time.", 400)
  if (venue.length < 2) fail("Add the venue.", 400)
  if (city.length < 2) fail("Add the city.", 400)
  if (!Number.isFinite(price) || price < 0) fail("Enter a price of zero or more.", 400)
  return { title, artist, category, eventDate, eventTime, venue, city, address, blurb, price }
}

function readTicket(body) {
  const name = String(body.tier || body.name || "").trim()
  const price = Number(body.price)
  const quantity = Number(body.quantity)
  const note = String(body.note || "").trim().slice(0, 255)
  const salesStart = dateOrNull(body.salesStart, "sales start")
  const salesEnd = dateOrNull(body.salesEnd, "sales end")
  if (name.length < 2) fail("Name the ticket.", 400)
  if (!Number.isFinite(price) || price < 0) fail("Enter a ticket price of zero or more.", 400)
  if (!Number.isInteger(quantity) || quantity < 0) fail("Enter a whole ticket quantity.", 400)
  if (salesStart && salesEnd && salesEnd < salesStart) fail("Sales end is before the start date.", 400)
  return { name, price, quantity, note, salesStart, salesEnd }
}

const eventSelect = `
  SELECT e.id, e.organizer_id, u.name AS organizer_name, u.organization,
    e.title, e.artist, e.category,
    DATE_FORMAT(e.event_date, '%Y-%m-%d') AS event_date,
    e.event_time, e.venue, e.address, e.city, e.price, e.image, e.blurb, e.description,
    e.approval_status, e.rejection_reason
  FROM events e
  JOIN users u ON u.id = e.organizer_id
`

function deskEvent(row) {
  return {
    id: row.id,
    organizerId: row.organizer_id,
    organizer: row.organizer_name,
    organization: row.organization || "",
    title: row.title,
    artist: row.artist,
    category: row.category,
    date: row.event_date,
    time: row.event_time,
    venue: row.venue,
    address: row.address,
    city: row.city,
    price: Number(row.price),
    blurb: row.blurb,
    status: labelStatus(row.approval_status),
    rejectionReason: row.rejection_reason || "",
  }
}

function publicEvent(row, tickets) {
  return {
    id: `live-${row.id}`,
    title: row.title,
    artist: row.artist,
    category: row.category,
    date: row.event_date,
    time: row.event_time,
    venue: row.venue,
    address: row.address || row.venue,
    city: row.city,
    price: Number(row.price),
    image: row.image || "/images/crowd.jpg",
    featured: false,
    status: "Approved",
    blurb: row.blurb || `${row.artist} at ${row.venue}.`,
    description: row.description || row.blurb || `${row.artist} plays ${row.venue}.`,
    lineup: [row.artist].filter(Boolean),
    tickets,
  }
}

const ticketSelect = `
  SELECT t.id, t.event_id, t.organizer_id, e.title AS event_title,
    t.name, t.price, t.note, t.quantity,
    DATE_FORMAT(t.sales_start, '%Y-%m-%d') AS sales_start,
    DATE_FORMAT(t.sales_end, '%Y-%m-%d') AS sales_end,
    t.approval_status, t.rejection_reason,
    u.name AS organizer_name, u.organization
  FROM tickets t
  JOIN events e ON e.id = t.event_id
  JOIN users u ON u.id = t.organizer_id
`

function deskTicket(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    event: row.event_title,
    organizerId: row.organizer_id,
    organizer: row.organizer_name,
    organization: row.organization || "",
    tier: row.name,
    price: Number(row.price),
    note: row.note,
    quantity: Number(row.quantity),
    salesStart: row.sales_start || "",
    salesEnd: row.sales_end || "",
    status: labelStatus(row.approval_status),
    rejectionReason: row.rejection_reason || "",
  }
}

async function listEvents(actor) {
  if (!actor) fail("Sign in again.", 401)
  if (actor.role === "admin") {
    const rows = await query(`${eventSelect} ORDER BY e.created_at DESC`)
    return rows.map(deskEvent)
  }
  if (actor.role === "organizer") {
    const rows = await query(`${eventSelect} WHERE e.organizer_id = ? ORDER BY e.created_at DESC`, [actor.id])
    return rows.map(deskEvent)
  }
  fail("Only the admin or an organizer can view this desk.", 403)
}

async function publicEvents() {
  const rows = await query(
    `${eventSelect} WHERE e.approval_status = 'approved' AND u.status = 'active' ORDER BY e.event_date ASC`,
  )
  if (!rows.length) return []
  const ids = rows.map((row) => row.id)
  const tickets = await query(
    `SELECT id, event_id, name, price, note, quantity
     FROM tickets
     WHERE approval_status = 'approved' AND event_id IN (${ids.map(() => "?").join(",")})
     ORDER BY price ASC`,
    ids,
  )
  const grouped = new Map()
  for (const ticket of tickets) {
    const list = grouped.get(ticket.event_id) || []
    list.push({
      id: `live-tk-${ticket.id}`,
      name: ticket.name,
      price: Number(ticket.price),
      note: ticket.note || "General admission",
      left: Number(ticket.quantity) || 0,
    })
    grouped.set(ticket.event_id, list)
  }
  return rows.map((row) => publicEvent(row, grouped.get(row.id) || []))
}

async function ownEvent(actor, id) {
  const rows = await query("SELECT * FROM events WHERE id = ?", [id])
  const row = rows[0]
  if (!row) fail("That event was not found.", 404)
  if (row.organizer_id !== actor.id) fail("You can only change your own events.", 403)
  return row
}

async function saveEvent(actor, body, id) {
  requireOrganizer(actor)
  const fields = readEvent(body)
  if (id) await ownEvent(actor, id)
  const params = [
    fields.title,
    fields.artist,
    fields.category,
    fields.eventDate,
    fields.eventTime,
    fields.venue,
    fields.address,
    fields.city,
    fields.price,
    fields.blurb,
    fields.blurb,
  ]
  if (id) {
    await query(
      `UPDATE events
       SET title = ?, artist = ?, category = ?, event_date = ?, event_time = ?, venue = ?, address = ?, city = ?,
           price = ?, blurb = ?, description = ?, approval_status = 'pending', rejection_reason = ''
       WHERE id = ?`,
      [...params, id],
    )
  } else {
    const result = await query(
      `INSERT INTO events
        (organizer_id, title, artist, category, event_date, event_time, venue, address, city, price, blurb, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [actor.id, ...params],
    )
    id = result.insertId
  }
  const rows = await query(`${eventSelect} WHERE e.id = ?`, [id])
  return deskEvent(rows[0])
}

async function removeEvent(actor, id) {
  requireOrganizer(actor)
  await ownEvent(actor, id)
  await query("DELETE FROM events WHERE id = ?", [id])
}

async function listTickets(actor) {
  if (!actor) fail("Sign in again.", 401)
  if (actor.role === "admin") {
    const rows = await query(`${ticketSelect} ORDER BY t.created_at DESC`)
    return rows.map(deskTicket)
  }
  if (actor.role === "organizer") {
    const rows = await query(`${ticketSelect} WHERE t.organizer_id = ? ORDER BY t.created_at DESC`, [actor.id])
    return rows.map(deskTicket)
  }
  fail("Only the admin or an organizer can view this desk.", 403)
}

async function ownTicket(actor, id) {
  const rows = await query("SELECT * FROM tickets WHERE id = ?", [id])
  const row = rows[0]
  if (!row) fail("That ticket was not found.", 404)
  if (row.organizer_id !== actor.id) fail("You can only change your own tickets.", 403)
  return row
}

async function saveTicket(actor, body, id) {
  requireOrganizer(actor)
  const fields = readTicket(body)
  const eventId = Number(body.eventId)
  if (!eventId) fail("Choose one of your events.", 400)
  const events = await query("SELECT id, organizer_id FROM events WHERE id = ?", [eventId])
  const event = events[0]
  if (!event || event.organizer_id !== actor.id) fail("Choose one of your events.", 403)
  if (id) await ownTicket(actor, id)
  const params = [eventId, fields.name, fields.price, fields.note, fields.quantity, fields.salesStart, fields.salesEnd]
  if (id) {
    await query(
      `UPDATE tickets
       SET event_id = ?, name = ?, price = ?, note = ?, quantity = ?, sales_start = ?, sales_end = ?,
           approval_status = 'pending', rejection_reason = ''
       WHERE id = ?`,
      [...params, id],
    )
  } else {
    const result = await query(
      `INSERT INTO tickets (organizer_id, event_id, name, price, note, quantity, sales_start, sales_end)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [actor.id, ...params],
    )
    id = result.insertId
  }
  const rows = await query(`${ticketSelect} WHERE t.id = ?`, [id])
  return deskTicket(rows[0])
}

async function removeTicket(actor, id) {
  requireOrganizer(actor)
  await ownTicket(actor, id)
  await query("DELETE FROM tickets WHERE id = ?", [id])
}

async function reviewRow(actor, table, id, body) {
  requireAdmin(actor)
  if (table !== "events" && table !== "tickets") fail("That record was not found.", 404)
  const decision = body.decision === "approved" || body.decision === "rejected" ? body.decision : ""
  if (!decision) fail("Choose approve or reject.", 400)
  const reason = String(body.reason || "").trim().slice(0, 500)
  if (decision === "rejected" && reason.length < 3) fail("Add a rejection reason.", 400)
  const found = await query(`SELECT id FROM ${table} WHERE id = ?`, [id])
  if (!found.length) fail(table === "events" ? "That event was not found." : "That ticket was not found.", 404)
  await query(`UPDATE ${table} SET approval_status = ?, rejection_reason = ? WHERE id = ?`, [
    decision,
    decision === "rejected" ? reason : "",
    id,
  ])
}

async function accountFields(body, { creating, current }) {
  const name = String(body.name || "").trim()
  const email = String(body.email || current?.email || "").trim().toLowerCase()
  const password = String(body.password || "")
  const role = body.role === "organizer" ? "organizer" : body.role === "user" ? "user" : ""
  const phone = String(body.phone || "").trim()
  const city = String(body.city || "").trim()
  const organization = String(body.organization || "").trim()
  const status = ["active", "pending", "suspended", "rejected"].includes(body.status) ? body.status : ""
  if (name.length < 2) fail("Add the account name.", 400)
  if (!emailPattern.test(email)) fail("Enter a valid email address.", 400)
  if (email === adminEmail && current?.role !== "admin") fail("That email is reserved for the studio admin.", 400)
  if (!role) fail("Choose a user or organizer account.", 400)
  if (creating && password.length < 8) fail("Use at least 8 characters.", 400)
  if (!creating && password && password.length < 8) fail("Use at least 8 characters.", 400)
  if (role === "organizer" && organization.length < 2) fail("Add the organizer or company name.", 400)
  if (!status) fail("Choose a status.", 400)
  const taken = await query("SELECT id FROM users WHERE email = ? AND id <> ?", [email, current?.id || 0])
  if (taken.length) fail("An account with that email already exists.", 409)
  return { name, email, password, role, phone, city, organization, status }
}

async function createManagedAccount(actor, body) {
  requireAdmin(actor)
  if (body.role === "admin") fail("The studio already has its one admin account.", 400)
  const fields = await accountFields(body, { creating: true })
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, status, phone, city, organization)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [fields.name, fields.email, hashPassword(fields.password), fields.role, fields.status, fields.phone, fields.city, fields.organization],
  )
  const rows = await query("SELECT * FROM users WHERE id = ?", [result.insertId])
  return publicUser(rows[0])
}

async function updateManagedAccount(actor, id, body) {
  requireAdmin(actor)
  const found = await query("SELECT * FROM users WHERE id = ?", [id])
  const current = found[0]
  if (!current) fail("That account was not found.", 404)
  if (current.role === "admin") fail("The studio admin account is not edited here.", 400)
  const fields = await accountFields({ ...body, email: body.email || current.email }, { creating: false, current })
  if (fields.password) {
    await query(
      `UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, status = ?, phone = ?, city = ?, organization = ? WHERE id = ?`,
      [fields.name, fields.email, hashPassword(fields.password), fields.role, fields.status, fields.phone, fields.city, fields.organization, id],
    )
  } else {
    await query(
      `UPDATE users SET name = ?, email = ?, role = ?, status = ?, phone = ?, city = ?, organization = ? WHERE id = ?`,
      [fields.name, fields.email, fields.role, fields.status, fields.phone, fields.city, fields.organization, id],
    )
  }
  const rows = await query("SELECT * FROM users WHERE id = ?", [id])
  return publicUser(rows[0])
}

async function deleteManagedAccount(actor, id) {
  requireAdmin(actor)
  const found = await query("SELECT * FROM users WHERE id = ?", [id])
  const current = found[0]
  if (!current) fail("That account was not found.", 404)
  if (current.role === "admin") fail("The studio admin account cannot be deleted.", 400)
  await query("DELETE FROM tickets WHERE organizer_id = ?", [id])
  await query("DELETE FROM events WHERE organizer_id = ?", [id])
  await query("DELETE FROM programs WHERE organizer_id = ?", [id])
  await query("DELETE FROM users WHERE id = ?", [id])
}

const programKinds = {
  workshops: "workshop",
  courses: "course",
  categories: "category",
  centers: "center",
  enrollments: "enrollment",
}

const programSpecs = {
  workshop: { required: ["title", "instructor", "category", "date", "startTime", "endTime", "location", "city"], numbers: ["fee", "seats"] },
  course: { required: ["title", "instrument", "level", "instructor", "center", "date", "startTime", "endTime", "location"], numbers: ["price"], text: ["schedule"] },
  category: { required: ["name"], numbers: ["courses"] },
  center: { required: ["name", "city", "email"], text: ["area", "phone", "hours", "focus"] },
  enrollment: { required: ["student", "email", "course", "center", "date"] },
}

function programPayload(value) {
  if (!value) return {}
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }
  return value
}

function sanitizeProgram(kind, body) {
  const spec = programSpecs[kind]
  if (!spec) fail("That program is not available.", 404)
  const payload = {}
  for (const key of spec.required) {
    const value = String(body[key] ?? "").trim()
    if (!value) fail("Fill in every required field.", 400)
    if (key === "email" && !emailPattern.test(value)) fail("Enter a valid email address.", 400)
    if (key === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail("Enter a valid date.", 400)
    payload[key] = value
  }
  for (const key of spec.numbers || []) {
    const raw = body[key]
    const value = raw === "" || raw == null ? 0 : Number(raw)
    if (!Number.isFinite(value) || value < 0) fail("Enter a number that is zero or more.", 400)
    payload[key] = value
  }
  for (const key of spec.text || []) payload[key] = String(body[key] ?? "").trim()
  return payload
}

const programSelect = `
  SELECT p.id, p.organizer_id, p.kind, p.payload, p.approval_status, p.rejection_reason,
    u.name AS organizer_name, u.organization, u.status AS organizer_status
  FROM programs p
  JOIN users u ON u.id = p.organizer_id
`

function deskProgram(row) {
  return {
    ...programPayload(row.payload),
    id: row.id,
    organizerId: row.organizer_id,
    organizer: row.organizer_name,
    organization: row.organization || "",
    status: labelStatus(row.approval_status),
    rejectionReason: row.rejection_reason || "",
  }
}

async function listPrograms(actor, kind) {
  if (!actor) fail("Sign in again.", 401)
  if (actor.role === "admin") {
    const rows = await query(`${programSelect} WHERE p.kind = ? ORDER BY p.created_at DESC`, [kind])
    return rows.map(deskProgram)
  }
  if (actor.role === "organizer") {
    const rows = await query(`${programSelect} WHERE p.kind = ? AND p.organizer_id = ? ORDER BY p.created_at DESC`, [kind, actor.id])
    return rows.map(deskProgram)
  }
  fail("Only the admin or an organizer can view this desk.", 403)
}

async function saveProgram(actor, kind, body, id) {
  requireOrganizer(actor)
  const payload = JSON.stringify(sanitizeProgram(kind, body))
  if (id) {
    const found = await query("SELECT organizer_id FROM programs WHERE id = ? AND kind = ?", [id, kind])
    if (!found[0]) fail("That record was not found.", 404)
    if (found[0].organizer_id !== actor.id) fail("You can only change your own records.", 403)
    await query(
      "UPDATE programs SET payload = ?, approval_status = 'pending', rejection_reason = '' WHERE id = ?",
      [payload, id],
    )
  } else {
    const result = await query(
      "INSERT INTO programs (organizer_id, kind, payload) VALUES (?, ?, ?)",
      [actor.id, kind, payload],
    )
    id = result.insertId
  }
  const rows = await query(`${programSelect} WHERE p.id = ?`, [id])
  return deskProgram(rows[0])
}

async function removeProgram(actor, kind, id) {
  requireOrganizer(actor)
  const found = await query("SELECT organizer_id FROM programs WHERE id = ? AND kind = ?", [id, kind])
  if (!found[0]) fail("That record was not found.", 404)
  if (found[0].organizer_id !== actor.id) fail("You can only change your own records.", 403)
  await query("DELETE FROM programs WHERE id = ?", [id])
}

async function reviewProgram(actor, kind, id, body) {
  requireAdmin(actor)
  const decision = body.decision === "approved" || body.decision === "rejected" ? body.decision : ""
  if (!decision) fail("Choose approve or reject.", 400)
  const reason = String(body.reason || "").trim().slice(0, 500)
  if (decision === "rejected" && reason.length < 3) fail("Add a rejection reason.", 400)
  const found = await query("SELECT id FROM programs WHERE id = ? AND kind = ?", [id, kind])
  if (!found.length) fail("That record was not found.", 404)
  await query("UPDATE programs SET approval_status = ?, rejection_reason = ? WHERE id = ?", [
    decision,
    decision === "rejected" ? reason : "",
    id,
  ])
}

async function publicPrograms(kind) {
  const rows = await query(
    `${programSelect} WHERE p.kind = ? AND p.approval_status = 'approved' AND u.status = 'active' ORDER BY p.created_at DESC`,
    [kind],
  )
  return rows.map((row) => ({ ...programPayload(row.payload), id: row.id }))
}

async function buildReport(actor) {
  requireAdmin(actor)
  const accounts = await query(
    `SELECT
       SUM(role = 'user') AS users,
       SUM(role = 'organizer') AS organizers,
       SUM(role = 'user' AND status = 'active') AS active_users,
       SUM(role = 'organizer' AND status = 'pending') AS pending_organizers,
       SUM(role = 'admin') AS admins
     FROM users`,
  )
  const eventCounts = await query("SELECT approval_status, COUNT(*) AS total FROM events GROUP BY approval_status")
  const ticketCounts = await query("SELECT approval_status, COUNT(*) AS total FROM tickets GROUP BY approval_status")
  const pendingEvents = await query(
    `${eventSelect} WHERE e.approval_status = 'pending' ORDER BY e.created_at DESC LIMIT 8`,
  )
  const pendingTickets = await query(
    `${ticketSelect} WHERE t.approval_status = 'pending' ORDER BY t.created_at DESC LIMIT 8`,
  )
  const tally = (rows) => ({
    pending: Number(rows.find((row) => row.approval_status === "pending")?.total || 0),
    approved: Number(rows.find((row) => row.approval_status === "approved")?.total || 0),
    rejected: Number(rows.find((row) => row.approval_status === "rejected")?.total || 0),
  })
  const account = accounts[0] || {}
  return {
    generatedAt: new Date().toISOString(),
    admins: Number(account.admins || 0),
    accounts: {
      users: Number(account.users || 0),
      activeUsers: Number(account.active_users || 0),
      organizers: Number(account.organizers || 0),
      pendingOrganizers: Number(account.pending_organizers || 0),
    },
    events: tally(eventCounts),
    tickets: tally(ticketCounts),
    waiting: [
      ...pendingEvents.map((row) => ({ kind: "Event", title: row.title, owner: row.organizer_name })),
      ...pendingTickets.map((row) => ({ kind: "Ticket", title: `${row.event_title} · ${row.name}`, owner: row.organizer_name })),
    ],
  }
}

function clientMessage(error) {
  if (error.status) return error.message
  if (error.code === "ECONNREFUSED" || error.code === "PROTOCOL_CONNECTION_LOST") {
    return "Start MySQL in the XAMPP Control Panel, then try again."
  }
  if (error.code === "ER_ACCESS_DENIED_ERROR") {
    return "XAMPP MySQL rejected the login. Check the root user and password."
  }
  return "The account service failed."
}

export async function handleAuth(req, res) {
  const url = new URL(req.url || "/", "http://localhost")
  if (!url.pathname.startsWith("/api/")) return false

  try {
    await ensureDbOnce()
    if (req.method === "POST" && url.pathname === "/api/register") {
      return send(res, 201, await registerAccount(await readBody(req)))
    }
    if (req.method === "POST" && url.pathname === "/api/login") {
      return send(res, 200, await loginAccount(await readBody(req)))
    }

    if (req.method === "GET" && url.pathname === "/api/events/public") {
      return send(res, 200, { events: await publicEvents() })
    }
    const publicProgram = url.pathname.match(/^\/api\/programs\/(workshops|courses|centers)\/public$/)
    if (req.method === "GET" && publicProgram) {
      return send(res, 200, { items: await publicPrograms(programKinds[publicProgram[1]]) })
    }

    const actor = await userFromToken(req.headers.authorization)
    if (req.method === "GET" && url.pathname === "/api/me") {
      if (!actor) return send(res, 401, { error: "Sign in again." })
      return send(res, 200, { user: publicUser(actor) })
    }
    if (req.method === "GET" && url.pathname === "/api/users") {
      if (!actor || actor.role !== "admin") return send(res, 403, { error: "Only the admin can view accounts." })
      const users = (await query("SELECT * FROM users ORDER BY id DESC")).map(publicUser)
      return send(res, 200, { users })
    }
    if (req.method === "POST" && url.pathname === "/api/users") {
      return send(res, 201, { user: await createManagedAccount(actor, await readBody(req)) })
    }
    const statusMatch = url.pathname.match(/^\/api\/users\/(\d+)\/status$/)
    if (req.method === "PATCH" && statusMatch) {
      const body = await readBody(req)
      return send(res, 200, { user: await updateStatus(actor, Number(statusMatch[1]), body.status) })
    }
    const userMatch = url.pathname.match(/^\/api\/users\/(\d+)$/)
    if (userMatch && req.method === "PATCH") {
      return send(res, 200, { user: await updateManagedAccount(actor, Number(userMatch[1]), await readBody(req)) })
    }
    if (userMatch && req.method === "DELETE") {
      await deleteManagedAccount(actor, Number(userMatch[1]))
      return send(res, 200, { ok: true })
    }
    if (req.method === "GET" && url.pathname === "/api/reports") {
      return send(res, 200, { report: await buildReport(actor) })
    }
    if (req.method === "GET" && url.pathname === "/api/events") {
      return send(res, 200, { events: await listEvents(actor) })
    }
    if (req.method === "POST" && url.pathname === "/api/events") {
      return send(res, 201, { event: await saveEvent(actor, await readBody(req)) })
    }
    const eventReview = url.pathname.match(/^\/api\/events\/(\d+)\/review$/)
    if (req.method === "PATCH" && eventReview) {
      await reviewRow(actor, "events", Number(eventReview[1]), await readBody(req))
      return send(res, 200, { ok: true })
    }
    const eventMatch = url.pathname.match(/^\/api\/events\/(\d+)$/)
    if (eventMatch && req.method === "PATCH") {
      return send(res, 200, { event: await saveEvent(actor, await readBody(req), Number(eventMatch[1])) })
    }
    if (eventMatch && req.method === "DELETE") {
      await removeEvent(actor, Number(eventMatch[1]))
      return send(res, 200, { ok: true })
    }
    if (req.method === "GET" && url.pathname === "/api/tickets") {
      return send(res, 200, { tickets: await listTickets(actor) })
    }
    if (req.method === "POST" && url.pathname === "/api/tickets") {
      return send(res, 201, { ticket: await saveTicket(actor, await readBody(req)) })
    }
    const ticketReview = url.pathname.match(/^\/api\/tickets\/(\d+)\/review$/)
    if (req.method === "PATCH" && ticketReview) {
      await reviewRow(actor, "tickets", Number(ticketReview[1]), await readBody(req))
      return send(res, 200, { ok: true })
    }
    const ticketMatch = url.pathname.match(/^\/api\/tickets\/(\d+)$/)
    if (ticketMatch && req.method === "PATCH") {
      return send(res, 200, { ticket: await saveTicket(actor, await readBody(req), Number(ticketMatch[1])) })
    }
    if (ticketMatch && req.method === "DELETE") {
      await removeTicket(actor, Number(ticketMatch[1]))
      return send(res, 200, { ok: true })
    }
    const programReview = url.pathname.match(/^\/api\/programs\/(workshops|courses|categories|centers|enrollments)\/(\d+)\/review$/)
    if (req.method === "PATCH" && programReview) {
      await reviewProgram(actor, programKinds[programReview[1]], Number(programReview[2]), await readBody(req))
      return send(res, 200, { ok: true })
    }
    const programItem = url.pathname.match(/^\/api\/programs\/(workshops|courses|categories|centers|enrollments)\/(\d+)$/)
    if (programItem && req.method === "PATCH") {
      return send(res, 200, { item: await saveProgram(actor, programKinds[programItem[1]], await readBody(req), Number(programItem[2])) })
    }
    if (programItem && req.method === "DELETE") {
      await removeProgram(actor, programKinds[programItem[1]], Number(programItem[2]))
      return send(res, 200, { ok: true })
    }
    const programList = url.pathname.match(/^\/api\/programs\/(workshops|courses|categories|centers|enrollments)$/)
    if (programList && req.method === "GET") {
      return send(res, 200, { items: await listPrograms(actor, programKinds[programList[1]]) })
    }
    if (programList && req.method === "POST") {
      return send(res, 201, { item: await saveProgram(actor, programKinds[programList[1]], await readBody(req)) })
    }
    return send(res, 404, { error: "That account route does not exist." })
  } catch (error) {
    const status = error.status || (error.code === "ECONNREFUSED" ? 503 : 500)
    return send(res, status, { error: clientMessage(error) })
  }
}

export function attachAuth(middlewares) {
  middlewares.use((req, res, next) => {
    handleAuth(req, res)
      .then((handled) => {
        if (handled === false) next()
      })
      .catch(() => {
        if (!res.writableEnded) send(res, 500, { error: "The account service failed." })
      })
  })
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (invoked) {
  createServer((req, res) => {
    handleAuth(req, res)
  }).listen(3001, "127.0.0.1")
}
