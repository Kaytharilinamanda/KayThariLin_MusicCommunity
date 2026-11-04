import { useEffect, useState } from "react"
import Button from "../../components/ui/Button"
import Modal from "../../components/ui/Modal"
import { DataTable, Td } from "../../components/ui/DataTable"
import { SelectField, TextField } from "../../components/ui/Field"
import { StatusBadge } from "../../components/admin/ResourceScreen"
import { api } from "../../lib/api"
import { roleLabel, statusLabel } from "../../lib/account"
import { useAppState } from "../../context/AppState"

const empty = {
  name: "",
  email: "",
  password: "",
  phone: "",
  city: "",
  organization: "",
  role: "user",
  status: "active",
}

export default function LiveAccounts({ role, title, text }) {
  const { notify } = useAppState()
  const [users, setUsers] = useState([])
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)

  const lockedRole = role || ""

  async function load() {
    try {
      const data = await api("/api/users")
      setUsers(role ? data.users.filter((user) => user.role === role) : data.users)
      setError("")
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [role])

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreate() {
    setForm({ ...empty, role: lockedRole || "user", status: lockedRole === "organizer" ? "pending" : "active" })
    setEditing({ mode: "create" })
  }

  function openEdit(row) {
    setForm({
      name: row.name,
      email: row.email,
      password: "",
      phone: row.phone || "",
      city: row.city || "",
      organization: row.organization || "",
      role: row.role,
      status: row.status,
    })
    setEditing({ mode: "edit", id: row.id })
  }

  async function setStatus(id, status) {
    try {
      await api(`/api/users/${id}/status`, { method: "PATCH", body: { status } })
      notify(status === "active" ? "Account approved." : `Account marked ${status}.`)
      load()
    } catch (err) {
      notify(err.message)
    }
  }

  async function save(event) {
    event.preventDefault()
    const body = { ...form, role: lockedRole || form.role }
    try {
      if (editing.mode === "create") {
        await api("/api/users", { method: "POST", body })
        notify("Account created.")
      } else {
        await api(`/api/users/${editing.id}`, { method: "PATCH", body })
        notify("Account updated.")
      }
      setEditing(null)
      load()
    } catch (err) {
      notify(err.message)
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete ${row.name}? Their events and tickets are removed with the account.`)) return
    try {
      await api(`/api/users/${row.id}`, { method: "DELETE" })
      notify("Account deleted.")
      load()
    } catch (err) {
      notify(err.message)
    }
  }

  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">{text}</p>
        </div>
        <Button onClick={openCreate}>{lockedRole === "organizer" ? "Add organizer" : "Add account"}</Button>
      </div>
      {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}
      <DataTable
        columns={["Account", "Role", "City", "Status", ""]}
        rows={users}
        empty="No registered accounts yet."
        render={(row) => (
          <>
            <Td className="text-white">
              <p className="font-medium">{row.name}</p>
              <p className="text-xs text-zinc-500">{row.email}{row.organization ? ` · ${row.organization}` : ""}</p>
            </Td>
            <Td>{roleLabel(row.role)}</Td>
            <Td>{row.city || "—"}</Td>
            <Td><StatusBadge status={statusLabel(row.status)} /></Td>
            <Td>
              {row.role !== "admin" && (
                <div className="flex flex-wrap gap-2">
                  {row.status !== "active" && (
                    <Button variant="secondary" onClick={() => setStatus(row.id, "active")}>
                      {row.role === "organizer" ? "Approve" : "Activate"}
                    </Button>
                  )}
                  {row.role === "organizer" && row.status === "pending" && (
                    <Button variant="ghost" onClick={() => setStatus(row.id, "rejected")}>
                      Reject
                    </Button>
                  )}
                  {row.status === "active" && (
                    <Button variant="danger" onClick={() => setStatus(row.id, "suspended")}>
                      Suspend
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => openEdit(row)}>Edit</Button>
                  <Button variant="danger" onClick={() => remove(row)}>Delete</Button>
                </div>
              )}
            </Td>
          </>
        )}
      />

      <Modal
        open={Boolean(editing)}
        title={editing?.mode === "edit" ? "Edit account" : lockedRole === "organizer" ? "Add organizer" : "Add account"}
        subtitle="The studio keeps a single admin. New accounts are users or organizers."
        onClose={() => setEditing(null)}
      >
        <form className="grid gap-4" onSubmit={save}>
          <TextField id="acct-name" label="Name" value={form.name} onChange={(event) => update("name", event.target.value)} />
          <TextField id="acct-email" label="Email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
          <TextField
            id="acct-password"
            label={editing?.mode === "edit" ? "New password" : "Password"}
            type="password"
            value={form.password}
            hint={editing?.mode === "edit" ? "Leave blank to keep the current password." : "At least 8 characters."}
            onChange={(event) => update("password", event.target.value)}
          />
          {!lockedRole && (
            <SelectField id="acct-role" label="Role" value={form.role} onChange={(event) => update("role", event.target.value)}>
              <option value="user">User</option>
              <option value="organizer">Organizer</option>
            </SelectField>
          )}
          {(lockedRole === "organizer" || form.role === "organizer") && (
            <TextField id="acct-org" label="Organizer or company" value={form.organization} onChange={(event) => update("organization", event.target.value)} />
          )}
          <TextField id="acct-phone" label="Phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
          <TextField id="acct-city" label="City" value={form.city} onChange={(event) => update("city", event.target.value)} />
          <SelectField id="acct-status" label="Status" value={form.status} onChange={(event) => update("status", event.target.value)}>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </SelectField>
          <Button type="submit">{editing?.mode === "edit" ? "Save account" : "Create account"}</Button>
        </form>
      </Modal>
    </section>
  )
}
