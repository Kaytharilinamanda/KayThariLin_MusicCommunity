import LiveAccounts from "./LiveAccounts"
import { useTitle } from "../../lib/useTitle"

export default function ManageOrganizers() {
  useTitle("Organizers")
  return (
    <LiveAccounts
      role="organizer"
      title="Organizers"
      text="Create, edit, and delete organizer accounts. Pending registrations stay here until you approve or reject them. There is still only one admin account."
    />
  )
}
