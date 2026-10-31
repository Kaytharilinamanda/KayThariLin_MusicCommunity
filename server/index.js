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
    const statusMatch = url.pathname.match(/^\/api\/users\/(\d+)\/status$/)
    if (req.method === "PATCH" && statusMatch) {
      const body = await readBody(req)
      return send(res, 200, { user: await updateStatus(actor, Number(statusMatch[1]), body.status) })
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
