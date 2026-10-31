export const sampleOrders = [
  { id: "NR-2048", event: "One Night", tier: "Lounge", qty: 2, total: 156, status: "Paid", date: "2026-10-08" },
  { id: "NR-2050", event: "Heartline", tier: "Box", qty: 1, total: 90, status: "Pending", date: "2026-10-07" },
  { id: "NR-2051", event: "Cloud", tier: "Front", qty: 2, total: 96, status: "Paid", date: "2026-10-06" },
]

export const sampleWorkshops = [
  { id: "WR-1", title: "Vocal Presence", date: "2026-11-01", city: "Yangon", status: "Confirmed" },
  { id: "WR-2", title: "The Songwriting Room", date: "2026-10-25", city: "Yangon", status: "Confirmed" },
]

export const sampleCourses = [
  { id: "EN-118", title: "Piano Foundations", center: "Violet Street Academy", status: "Confirmed", date: "2026-10-07" },
  { id: "EN-120", title: "Voice Atelier", center: "Violet Street Academy", status: "Pending", date: "2026-10-06" },
]

export const sampleReviews = [
  { id: "RV-1", target: "One Night", kind: "Event", rating: 5, text: "Sai Sai had Thuwunna singing the second chorus.", date: "2026-10-09" },
  { id: "RV-2", target: "Piano Foundations", kind: "Course", rating: 4, text: "Clear pacing, and the practice room was easy to book.", date: "2026-10-04" },
]

export const organizerEvents = [
  {
    id: "OE-1",
    title: "One Night",
    artist: "Sai Sai Kham Leng",
    city: "Yangon",
    venue: "Thuwunna Indoor Stadium",
    date: "2026-10-18",
    time: "7:00 PM",
    price: 45,
    quantity: 400,
    salesStart: "2026-09-01",
    salesEnd: "2026-10-18",
    status: "Published",
  },
  {
    id: "OE-2",
    title: "Heartline",
    artist: "Po Po",
    city: "Yangon",
    venue: "National Theatre",
    date: "2026-11-02",
    time: "7:00 PM",
    price: 35,
    quantity: 180,
    salesStart: "2026-10-01",
    salesEnd: "2026-11-02",
    status: "Pending approval",
  },
]

export const organizerTickets = [
  { id: "TK-1", event: "One Night", tier: "Lounge", price: 78, quantity: 120, sold: 86, salesStart: "2026-09-01", salesEnd: "2026-10-18", status: "On sale" },
  { id: "TK-2", event: "One Night", tier: "Balcony", price: 62, quantity: 200, sold: 140, salesStart: "2026-09-01", salesEnd: "2026-10-18", status: "On sale" },
  { id: "TK-3", event: "Heartline", tier: "Box", price: 90, quantity: 24, sold: 0, salesStart: "2026-10-01", salesEnd: "2026-11-02", status: "Held" },
]

export const organizerOrders = [
  { id: "NR-2048", buyer: "Amy", email: "amy@mail.com", event: "One Night", tier: "Lounge", qty: 2, total: 156, status: "Paid", date: "2026-10-08" },
  { id: "NR-2060", buyer: "Hnin", email: "hnin@mail.com", event: "One Night", tier: "Balcony", qty: 1, total: 62, status: "Paid", date: "2026-10-09" },
  { id: "NR-2061", buyer: "Ko Ko", email: "koko@mail.com", event: "Heartline", tier: "Box", qty: 1, total: 90, status: "Pending", date: "2026-10-10" },
]

export const organizerAnnouncements = [
  { id: "OA-1", title: "Doors at 6:15 for One Night", event: "One Night", audience: "Ticket holders", status: "Published", date: "2026-10-11" },
]

export const organizerAds = [
  { id: "AD-1", title: "One Night — Thuwunna", event: "One Night", placement: "Home banner", status: "Published", date: "2026-10-01" },
]

export const organizerRefunds = [
  { id: "RF-1", order: "NR-2048", event: "One Night", buyer: "Amy", amount: 156, reason: "Cannot travel to Yangon that weekend.", status: "Open" },
]

export const organizerEnquiries = [
  { id: "Q-1", from: "Hnin", event: "One Night", message: "Is the balcony seated, or standing?", status: "Open", reply: "" },
]
