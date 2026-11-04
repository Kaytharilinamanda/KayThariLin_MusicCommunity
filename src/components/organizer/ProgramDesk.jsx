import { useEffect, useState } from "react"
import Button from "../ui/Button"
import { DataTable, Td } from "../ui/DataTable"
import { SelectField, TextField } from "../ui/Field"
import { StatusBadge } from "../admin/ResourceScreen"
import { api } from "../../lib/api"
import { useAppState } from "../../context/AppState"
import { useTitle } from "../../lib/useTitle"

function blank(fields) {
  return Object.fromEntries(fields.map((field) => [field.name, field.type === "select" ? field.options[0] : ""]))
}

export default function ProgramDesk({ kind, title, text, fields, columns, render }) {
  useTitle(title)
  const { notify } = useAppState()
  const [rows, setRows] = useState([])
  const [error, setError] = useState("")
  const [form, setForm] = useState(() => blank(fields))
  const [editing, setEditing] = useState("")

  async function load() {
    try {
      const data = await api(`/api/programs/${kind}`)
      setRows(data.items || [])
      setError("")
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [kind])

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save(event) {
    event.preventDefault()
    try {
      if (editing) {
        await api(`/api/programs/${kind}/${editing}`, { method: "PATCH", body: form })
        notify("Updated and sent back for approval.")
      } else {
        await api(`/api/programs/${kind}`, { method: "POST", body: form })
        notify("Submitted for admin approval.")
      }
      setEditing("")
      setForm(blank(fields))
      load()
    } catch (err) {
      notify(err.message)
    }
  }

  async function remove(row) {
    const label = row.title || row.name || row.student || "this record"
    if (!window.confirm(`Delete ${label}?`)) return
    try {
      await api(`/api/programs/${kind}/${row.id}`, { method: "DELETE" })
      if (editing === row.id) {
        setEditing("")
        setForm(blank(fields))
      }
      notify("Deleted.")
      load()
    } catch (err) {
      notify(err.message)
    }
  }

  return (
    <section>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">{text}</p>
      </div>
      {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}
      <form className="mb-6 grid gap-4 rounded-3xl border border-white/10 bg-panel p-5 sm:grid-cols-2" onSubmit={save}>
        {fields.map((field) => {
          const shared = {
            id: `${kind}-${field.name}`,
            label: field.label,
            value: form[field.name] ?? "",
            onChange: (event) => update(field.name, event.target.value),
          }
          if (field.type === "select") {
            return (
              <SelectField key={field.name} {...shared}>
                {field.options.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </SelectField>
            )
          }
          return <TextField key={field.name} {...shared} type={field.type || "text"} />
        })}
        {editing && (
          <p className="text-sm text-amber-100 sm:col-span-2">Saving sends this back to Pending. The admin approves it before it is published.</p>
        )}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit">{editing ? "Save and resubmit" : "Submit for approval"}</Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={() => { setEditing(""); setForm(blank(fields)) }}>
              Clear
            </Button>
          )}
        </div>
      </form>
      <DataTable
        columns={[...columns, "Status", ""]}
        rows={rows}
        empty={`No ${title.toLowerCase()} yet.`}
        render={(row) => (
          <>
            {render(row)}
            <Td>
              <StatusBadge status={row.status} />
              {row.status === "Rejected" && row.rejectionReason && (
                <p className="mt-1 max-w-[220px] text-xs text-rose-200">{row.rejectionReason}</p>
              )}
            </Td>
            <Td>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(row.id)
                    setForm(Object.fromEntries(fields.map((field) => [field.name, row[field.name] ?? ""])))
                  }}
                >
                  {row.status === "Rejected" ? "Correct and resubmit" : "Edit"}
                </Button>
                <Button variant="danger" onClick={() => remove(row)}>Delete</Button>
              </div>
            </Td>
          </>
        )}
      />
    </section>
  )
}
