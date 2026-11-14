import ResourceScreen, { Cell, StatusBadge } from "../../components/admin/ResourceScreen"
import { useTitle } from "../../lib/useTitle"

export default function ManagePosts() {
  useTitle("Community posts")
  return (
    <ResourceScreen
      title="Community posts"
      description="Posts saved by members. Open a post to read it, or remove it from the feed. Members create the posts."
      createLabel="Add post"
      endpoint="/api/posts/manage"
      listKey="posts"
      readOnly
      canDelete
      seed={[]}
      searchKeys={["author", "excerpt", "topic"]}
      filters={[{ key: "status", label: "Statuses", options: ["Visible", "Hidden"] }, { key: "topic", label: "Topics", options: ["Hip-Hop", "Practice", "Guitar", "Rock", "Production", "Songwriting"] }]}
      columns={["Author", "Post", "Topic", "Likes", "Status", "Actions"]}
      fields={[
        { name: "author", label: "Author" },
        { name: "excerpt", label: "Excerpt", type: "textarea" },
        { name: "topic", label: "Topic" },
        { name: "likes", label: "Likes", type: "number" },
        { name: "status", label: "Status", type: "select", options: ["Visible", "Hidden"] },
      ]}
      renderCells={(row) => (
        <>
          <Cell className="font-medium text-white">{row.author}</Cell>
          <Cell className="max-w-xs">
            <p className="line-clamp-3 whitespace-pre-wrap">{row.excerpt || "Photo post"}</p>
            {row.image ? <img src={row.image} alt="" className="mt-2 h-14 w-20 rounded-lg object-cover" /> : null}
          </Cell>
          <Cell>{row.topic}</Cell>
          <Cell>{row.likes}</Cell>
          <Cell>
            <StatusBadge status={row.status} />
          </Cell>
        </>
      )}
      detail={(row) => [
        ["Author", row.author],
        ["Date", row.date],
        ["Topic", row.topic],
        ["Post", row.excerpt || "No written text."],
        ["Photo", row.image || "None"],
        ["Likes", row.likes],
        ["Status", row.status],
      ]}
    />
  )
}
