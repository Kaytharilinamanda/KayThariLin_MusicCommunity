import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import ActionMenu from "../ui/ActionMenu"
import Badge from "../ui/Badge"
import Button from "../ui/Button"
import Modal from "../ui/Modal"
import { SelectField, TextArea, TextField } from "../ui/Field"
import { useAppState } from "../../context/AppState"
import { cn, statusTone } from "../../lib/format"

function blankForm(fields) {
  return Object.fromEntries(
    fields.map((field) => [field.name, field.type === "select" ? field.options[0] : ""]),
  )
}

export function StatusBadge({ status }) {
  return <Badge tone={statusTone(status)}>{status}</Badge>
}

export function Cell({ children, className = "" }) {
  return <td className={cn("px-4 py-3 text-zinc-300", className)}>{children}</td>
}

export default function ResourceScreen({
  title,
  description,
  createLabel,
  seed,
  columns,
  fields,
  searchKeys,
  filters = [],
  renderCells,
  detail,
}) {
  const { notify } = useAppState()
  const [rows, setRows] = useState(seed)
  const [query, setQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState({})
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const needle = query.trim().toLowerCase()
      const matchesQuery =
        !needle || searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(needle))
      const matchesFilters = filters.every((filter) => {
        const selected = activeFilters[filter.key]
        return !selected || selected === "All" || row[filter.key] === selected
      })
      return matchesQuery && matchesFilters
    })
  }, [rows, query, searchKeys, filters, activeFilters])

  function openCreate() {
    setForm(blankForm(fields))
    setErrors({})
    setEditing({ mode: "create" })
  }

  function openEdit(row) {
    setForm(Object.fromEntries(fields.map((field) => [field.name, row[field.name] ?? ""])))
    setErrors({})
    setEditing({ mode: "edit", id: row.id })
  }

  function save(event) {
    event.preventDefault()
    const nextErrors = {}
    fields.forEach((field) => {
      if (field.optional) return
      if (String(form[field.name] ?? "").trim() === "") nextErrors[field.name] = "Required"
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const payload = { ...form }
    fields.forEach((field) => {
      if (field.type === "number") payload[field.name] = Number(form[field.name]) || 0
    })

    if (editing.mode === "create") {
      setRows((current) => [{ id: `local-${crypto.randomUUID().slice(0, 8)}`, ...payload }, ...current])
      notify(`${title.slice(0, -1) || "Item"} added to this preview.`)
    } else {
      setRows((current) => current.map((row) => (row.id === editing.id ? { ...row, ...payload } : row)))
      notify("Changes kept in this preview.")
    }
    setEditing(null)
  }

  function confirmRemove() {
    setRows((current) => current.filter((row) => row.id !== removing.id))
    notify("Removed from this preview.")
    setRemoving(null)
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Studio</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-white">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">{description}</p>
        </div>
        <Button onClick={openCreate}>{createLabel}</Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-panel p-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search {title}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${title.toLowerCase()}`}
            className="w-full rounded-xl border border-white/10 bg-ink py-2.5 pr-3 pl-10 text-sm outline-none focus:border-violet-400/60"
          />
        </label>
        {filters.map((filter) => (
          <select
            key={filter.key}
            value={activeFilters[filter.key] || "All"}
            onChange={(event) => setActiveFilters((current) => ({ ...current, [filter.key]: event.target.value }))}
            className="rounded-xl border border-white/10 bg-ink px-3 py-2.5 text-sm text-zinc-200 outline-none"
          >
            <option value="All">All {filter.label.toLowerCase()}</option>
            {filter.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-panel">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.14em] text-zinc-500">
            <tr>
              {columns.map((column) => (
                <th key={column || "actions"} className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center text-zinc-400">
                  Nothing matches those filters.
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id} className="align-middle hover:bg-white/[0.03]">
                {renderCells(row)}
                <td className="px-4 py-3 text-right">
                  <ActionMenu
                    items={[
                      { label: "View", onClick: () => setViewing(row) },
                      { label: "Edit", onClick: () => openEdit(row) },
                      { label: "Remove", danger: true, onClick: () => setRemoving(row) },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Showing {filtered.length} of {rows.length}
      </p>

      <Modal
        open={Boolean(editing)}
        title={editing?.mode === "edit" ? `Edit ${title.slice(0, -1) || "item"}` : createLabel}
        subtitle="This stays in the browser preview."
        onClose={() => setEditing(null)}
      >
        <form className="grid gap-4" onSubmit={save}>
          {fields.map((field) => {
            const shared = {
              id: field.name,
              label: field.label,
              value: form[field.name] ?? "",
              error: errors[field.name],
              onChange: (event) => setForm((current) => ({ ...current, [field.name]: event.target.value })),
            }
            if (field.type === "select") {
              return (
                <SelectField key={field.name} {...shared}>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectField>
              )
            }
            if (field.type === "textarea") {
              return <TextArea key={field.name} {...shared} />
            }
            return <TextField key={field.name} {...shared} type={field.type === "number" ? "number" : field.type || "text"} />
          })}
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(viewing)} title="Details" onClose={() => setViewing(null)}>
        {viewing && (
          <dl className="divide-y divide-white/8">
            {detail(viewing).map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                <dt className="text-zinc-500">{label}</dt>
                <dd className={cn("text-right text-zinc-100", label === "Status" && "text-left")}>
                  {label === "Status" ? <StatusBadge status={value} /> : value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>

      <Modal open={Boolean(removing)} title="Remove this record?" subtitle="It disappears from the preview only." onClose={() => setRemoving(null)}>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setRemoving(null)}>
            Keep it
          </Button>
          <Button variant="danger" onClick={confirmRemove}>
            Remove
          </Button>
        </div>
      </Modal>
    </section>
  )
}
