export function money(value) {
  const amount = Number(value) || 0
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function longDate(iso) {
  if (!iso) return ""
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function shortDate(iso) {
  if (!iso) return ""
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

export function dayDistance(iso) {
  const date = new Date(`${iso}T00:00:00`)
  return (date - startOfToday()) / 86400000
}

export function isSameMonth(iso, reference = new Date()) {
  const date = new Date(`${iso}T00:00:00`)
  return date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear()
}

export function cn(...parts) {
  return parts.filter(Boolean).join(" ")
}

export function statusTone(status) {
  const map = {
    Published: "green",
    "On sale": "green",
    Held: "neutral",
    Confirmed: "green",
    Paid: "green",
    Active: "green",
    Visible: "green",
    Draft: "neutral",
    Pending: "amber",
    "Pending approval": "amber",
    "Refund requested": "amber",
    Open: "amber",
    Waitlist: "amber",
    Invited: "amber",
    Scheduled: "violet",
    "Sold out": "rose",
    Refunded: "rose",
    Cancelled: "rose",
    Declined: "rose",
    Suspended: "rose",
    Rejected: "rose",
    Hidden: "rose",
  }
  return map[status] || "neutral"
}

export function nameFromEmail(email) {
  const local = String(email).split("@")[0].replace(/[._-]+/g, " ")
  return local.replace(/\b\w/g, (letter) => letter.toUpperCase())
}
