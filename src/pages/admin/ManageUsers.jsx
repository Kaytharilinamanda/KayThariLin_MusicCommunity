import { useTitle } from "../../lib/useTitle"
import LiveAccounts from "./LiveAccounts"

export default function ManageUsers() {
  useTitle("Users")
  return (
    <LiveAccounts
      title="Registered accounts"
      text="Create, edit, and delete user and organizer accounts. The studio keeps one admin account, and that account is not edited here."
    />
  )
}
