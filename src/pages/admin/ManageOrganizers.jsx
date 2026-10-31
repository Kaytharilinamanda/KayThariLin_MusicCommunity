import LiveAccounts from "./LiveAccounts"
import { useTitle } from "../../lib/useTitle"

export default function ManageOrganizers() {
  useTitle("Organizers")
  return (
    <LiveAccounts
      role="organizer"
      title="Organizers"
      text="Registration requests land here as pending. Approve an organizer before their shows should go public. Reject keeps the account out of the desk."
    />
  )
}
