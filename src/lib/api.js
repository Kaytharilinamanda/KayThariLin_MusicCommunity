import { readToken } from "./account"

export async function api(path, { method = "GET", body } = {}) {
  const token = readToken()
  let response
  try {
    response = await fetch(path, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error("The account service is not reachable.")
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || "Request failed.")
  return data
}
