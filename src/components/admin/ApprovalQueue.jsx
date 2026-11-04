import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import Button from "../ui/Button"
import Modal from "../ui/Modal"
import { TextArea } from "../ui/Field"
import { DataTable, Td } from "../ui/DataTable"
import { api } from "../../lib/api"
import { useAppState } from "../../context/AppState"
import { StatusBadge } from "./ResourceScreen"

export default function ApprovalQueue({
  title,
  description,
  listKey,
  reviewBase,
  columns,
  searchKeys,
  renderCells,
  detail,
}) {
  const { notify } = useAppState()
  const [rows, setRows] = useState([])
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [viewing, setViewing] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState("")

  async function load() {
    try {
      const data = await api(reviewBase)
      setRows(data[listKey] || [])
      setError("")
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [reviewBase, listKey])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) => searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(needle)))
  }, [rows, query, searchKeys])

  async function review(row, decision, note = "") {
    try {
      await api(`${reviewBase}/${row.id}/review`, { method: "PATCH", body: { decision, reason: note } })
      notify(decision === "approved" ? "Approved." : "Rejected.")
      setRejecting(null)
      setReason("")
      load()
    } catch (err) {
      notify(err.message)
    }
  }

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Studio</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-white">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">{description}</p>

      <label className="relative mt-6 block">
        <span className="sr-only">Search {title}</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${title.toLowerCase()}`}
          className="w-full rounded-2xl border border-white/10 bg-panel py-2.5 pr-3 pl-10 text-sm outline-none focus:border-violet-400/60"
        />
      </label>
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={filtered}
          empty="Nothing is waiting in this queue."
          render={(row) => (
            <>
              {renderCells(row)}
              <Td>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="ghost" onClick={() => setViewing(row)}>View</Button>
                  {row.status !== "Approved" && (
                    <Button variant="secondary" onClick={() => review(row, "approved")}>Approve</Button>
                  )}
                  {row.status !== "Rejected" && (
                    <Button variant="danger" onClick={() => { setRejecting(row); setReason(row.rejectionReason || "") }}>
                      Reject
                    </Button>
                  )}
                </div>
              </Td>
            </>
          )}
        />
      </div>

      <Modal open={Boolean(viewing)} title={viewing?.title || viewing?.tier || "Details"} onClose={() => setViewing(null)}>
        {viewing && (
          <dl className="space-y-3 text-sm">
            {detail(viewing).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</dt>
                <dd className="mt-1 text-zinc-200">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>

      <Modal
        open={Boolean(rejecting)}
        title="Reject submission"
        subtitle="The organizer will see this reason and can correct the submission."
        onClose={() => setRejecting(null)}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            review(rejecting, "rejected", reason)
          }}
        >
          <TextArea id="reject-reason" label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          <Button type="submit" variant="danger">Reject and send reason</Button>
        </form>
      </Modal>
    </section>
  )
}

export function ApprovalStatus({ row }) {
  return (
    <Td>
      <StatusBadge status={row.status} />
      {row.status === "Rejected" && row.rejectionReason && (
        <p className="mt-1 max-w-[220px] text-xs text-rose-200">{row.rejectionReason}</p>
      )}
    </Td>
  )
}
