import { cn } from "../../lib/format"

export function Stat({ label, value, detail }) {
  return (
    <div className="rounded-3xl border border-[#f3d6da] bg-raised p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 font-display text-3xl text-white">{value}</p>
      {detail && <p className="mt-2 text-sm text-zinc-400">{detail}</p>}
    </div>
  )
}

export function DataTable({ columns, rows, render, empty }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-[#f3d6da] bg-raised shadow-sm">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-zinc-400">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-white/5 last:border-0">
              {render(row)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Td({ children, className = "" }) {
  return <td className={cn("px-4 py-3 align-middle text-zinc-300", className)}>{children}</td>
}
