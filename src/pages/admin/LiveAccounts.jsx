import { useEffect, useState } from "react"
import Button from "../../components/ui/Button"
import { DataTable, Td } from "../../components/ui/DataTable"
import { StatusBadge } from "../../components/admin/ResourceScreen"
import { api } from "../../lib/api"
import { roleLabel, statusLabel } from "../../lib/account"
import { useAppState } from "../../context/AppState"

export default function LiveAccounts({ role, title, text }) {
  const { notify } = useAppState()
  const [users, setUsers] = useState([])
  const [error, setError] = useState("")

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

  async function setStatus(id, status) {
    try {
      await api(`/api/users/${id}/status`, { method: "PATCH", body: { status } })
      notify(status === "active" ? "Account approved." : `Account marked ${status}.`)
      load()
    } catch (err) {
      notify(err.message)
    }
  }

  return (
    <section className="mb-10">
      <h2 className="font-display text-2xl text-white">{title}</h2>
      <p className="mt-2 mb-4 max-w-2xl text-sm text-zinc-400">{text}</p>
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
                </div>
              )}
            </Td>
          </>
        )}
      />
    </section>
  )
}
