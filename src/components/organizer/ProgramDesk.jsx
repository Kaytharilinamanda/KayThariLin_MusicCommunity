import { useEffect, useRef, useState } from "react"
import { Image } from "lucide-react"
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

export default function ProgramDesk({ kind, title, text, fields, columns, render, withImage = false }) {
  useTitle(title)
  const { notify } = useAppState()
  const [rows, setRows] = useState([])
  const [error, setError] = useState("")
  const [form, setForm] = useState(() => blank(fields))
  const [image, setImage] = useState("")
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState("")
  const fileInput = useRef(null)

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

  function reset() {
    setEditing("")
    setForm(blank(fields))
    setImage("")
  }

  async function chooseImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      notify("Use a JPG, PNG, WEBP, or GIF photo.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      notify("Choose a photo smaller than 2 MB.")
      return
    }
    const body = new FormData()
    body.append("photo", file)
    setUploading(true)
    try {
      const data = await api("/api/programs/image", { method: "POST", body })
      setImage(data.image)
      notify("Photo added.")
    } catch (err) {
      notify(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function save(event) {
    event.preventDefault()
    if (uploading) return
    if (withImage && !image) {
      notify("Add a photo before submitting.")
      return
    }
    const body = withImage ? { ...form, image } : form
    try {
      if (editing) {
        await api(`/api/programs/${kind}/${editing}`, { method: "PATCH", body })
        notify("Updated and sent back for approval.")
      } else {
        await api(`/api/programs/${kind}`, { method: "POST", body })
        notify("Submitted for admin approval.")
      }
      reset()
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
      if (editing === row.id) reset()
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
        {withImage && (
          <div className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-zinc-200">Photo</span>
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#ead7da] bg-[#fffdfb] p-3">
              {image ? (
                <img src={image} alt="" className="h-24 w-36 rounded-xl object-cover" />
              ) : (
                <span className="grid h-24 w-36 place-items-center rounded-xl bg-[#fff1f2] text-[#9f1239]">
                  <Image className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
              <div>
                <input
                  ref={fileInput}
                  id={`${kind}-photo`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={chooseImage}
                />
                <Button type="button" variant="secondary" disabled={uploading} onClick={() => fileInput.current?.click()}>
                  {uploading ? "Uploading…" : image ? "Change photo" : "Upload photo"}
                </Button>
                <p className="mt-2 text-xs text-zinc-500">JPG, PNG, WEBP, or GIF. Up to 2 MB. This is the image on the public page.</p>
              </div>
            </div>
          </div>
        )}
        {editing && (
          <p className="text-sm text-amber-100 sm:col-span-2">Saving sends this back to Pending. The admin approves it before it is published.</p>
        )}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit">{editing ? "Save and resubmit" : "Submit for approval"}</Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={reset}>
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
                    setImage(withImage ? row.image || "" : "")
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
