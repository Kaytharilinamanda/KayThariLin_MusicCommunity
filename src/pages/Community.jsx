import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Heart, ImagePlus, MessageCircle, Share2, Trash2 } from "lucide-react"
import { Avatar } from "../components/account/ProfilePhoto"
import Button from "../components/ui/Button"
import Container from "../components/ui/Container"
import Cover from "../components/ui/Cover"
import Modal from "../components/ui/Modal"
import PageHero from "../components/ui/PageHero"
import { api } from "../lib/api"
import { cachedRows, loadCached, sameRows } from "../lib/catalog"
import { useAppState } from "../context/AppState"
import { useTitle } from "../lib/useTitle"
import SignInPrompt from "../components/auth/SignInPrompt"

function threadCount(post) {
  return (post.comments || []).reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0)
}

function ReplyComposer({ user, value, author, onChange, onSend }) {
  return (
    <div className="ml-11 flex gap-2">
      <Avatar user={user} className="h-8 w-8 shrink-0 text-[11px]" />
      <input
        autoFocus
        value={value}
        onChange={onChange}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            onSend()
          }
        }}
        placeholder={`Reply to ${author}`}
        className="w-full rounded-full border border-white/10 bg-ink px-4 py-2 text-sm outline-none"
      />
      <Button onClick={onSend}>Send</Button>
    </div>
  )
}

function SharedCard({ post }) {
  if (!post) return null
  if (post.missing) {
    return <p className="mt-3 rounded-2xl border border-[#ead7da] bg-[#fffdfb] px-4 py-3 text-sm text-[#57534e]">This post is no longer available.</p>
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-[#ead7da] bg-[#fffdfb]">
      <div className="flex items-center gap-3 p-3">
        <Cover src={post.avatar} alt="" className="h-9 w-9 rounded-full" />
        <div>
          <p className="text-sm font-medium text-[#1c1416]">
            {post.author} <span className="font-normal text-[#8a737a]">{post.handle}</span>
          </p>
          <p className="text-xs text-[#8a737a]">{post.time} · {post.topic}</p>
        </div>
      </div>
      {post.text ? <p className="px-3 pb-3 text-sm leading-6 text-[#3d2a2e]">{post.text}</p> : null}
      {post.image ? <Cover src={post.image} alt="" className="max-h-80 w-full" /> : null}
    </div>
  )
}

const photoChoices = [
  { id: "stage", src: "/images/stage.jpg" },
  { id: "guitar", src: "/images/guitar.jpg" },
  { id: "notes", src: "/images/notes.jpg" },
  { id: "studio", src: "/images/studio.jpg" },
]

export default function Community() {
  useTitle("Community")
  const { user, notify } = useAppState()
  const navigate = useNavigate()
  const canPost = user?.role === "user"

  function asUser() {
    if (canPost) return true
    notify(user ? "Posts, likes, and comments use a user account." : "Sign in to post, like, or comment. You can still read the feed.")
    if (!user) navigate("/login", { state: { from: "/community" } })
    return false
  }
  const [feed, setFeed] = useState(() => cachedRows("posts") || [])
  const [topics, setTopics] = useState(() => cachedRows("topics") || [])
  const [members, setMembers] = useState(() => cachedRows("members") || [])
  const [settled, setSettled] = useState(() => Boolean(cachedRows("posts")?.length))
  const [draft, setDraft] = useState("")
  const [photo, setPhoto] = useState("")
  const [picker, setPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [openComments, setOpenComments] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [replyTarget, setReplyTarget] = useState(null)
  const [replyDrafts, setReplyDrafts] = useState({})
  const [shareTarget, setShareTarget] = useState(null)
  const [shareNote, setShareNote] = useState("")
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      loadCached("posts", async () => (await api("/api/posts")).posts || []),
      loadCached("topics", async () => (await api("/api/topics")).topics || []),
      loadCached("members", async () => (await api("/api/members")).members || []),
    ]).then(([posts, nextTopics, nextMembers]) => {
      if (!active) return
      setFeed((current) => (sameRows(current, posts) ? current : posts))
      setTopics((current) => (sameRows(current, nextTopics) ? current : nextTopics))
      setMembers((current) => (sameRows(current, nextMembers) ? current : nextMembers))
      setSettled(true)
    })
    return () => {
      active = false
    }
  }, [])

  async function chooseFile(event) {
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
      const data = await api("/api/posts/image", { method: "POST", body })
      setPhoto(data.image)
      notify("Photo added to this post.")
    } catch (error) {
      notify(error.message)
    } finally {
      setUploading(false)
    }
  }

  async function publish(event) {
    event.preventDefault()
    if (!asUser()) return
    if (!draft.trim()) {
      notify("Write something before posting.")
      return
    }
    try {
      const data = await api("/api/posts", { method: "POST", body: { text: draft.trim(), image: photo, topic: "Community" } })
      setFeed((current) => [data.post, ...current])
      setDraft("")
      setPhoto("")
      setPicker(false)
      notify("Posted to the community.")
    } catch (error) {
      notify(error.message)
    }
  }

  function openShare(post) {
    if (!asUser()) return
    if (post.mine && !post.share) {
      notify("Share someone else’s post.")
      return
    }
    setShareNote("")
    setShareTarget(post)
  }

  async function confirmShare() {
    if (!shareTarget || sharing) return
    setSharing(true)
    try {
      const data = await api(`/api/posts/${shareTarget.id}/share`, { method: "POST", body: { text: shareNote.trim() } })
      const originalId = data.post.share?.id
      setFeed((current) => [
        data.post,
        ...current.map((item) => (item.id === originalId ? { ...item, shares: (item.shares || 0) + 1 } : item)),
      ])
      setShareTarget(null)
      setShareNote("")
      notify("Shared to your feed.")
    } catch (error) {
      notify(error.message)
    } finally {
      setSharing(false)
    }
  }

  async function removePost(post) {
    if (!asUser()) return
    if (!window.confirm("Delete this post? It will leave the feed.")) return
    try {
      await api(`/api/posts/${post.id}`, { method: "DELETE" })
      setFeed((current) => current.filter((item) => item.id !== post.id))
      notify("Post deleted.")
    } catch (error) {
      notify(error.message)
    }
  }

  async function toggleLike(post) {
    if (!asUser()) return
    try {
      const data = await api(`/api/posts/${post.id}/like`, { method: "POST" })
      setFeed((current) => current.map((item) => (item.id === post.id ? data.post : item)))
    } catch (error) {
      notify(error.message)
    }
  }

  async function addComment(postId) {
    if (!asUser()) return
    const text = (commentDrafts[postId] || "").trim()
    if (!text) return
    try {
      const data = await api(`/api/posts/${postId}/comments`, { method: "POST", body: { text } })
      setFeed((current) => current.map((item) => (item.id === postId ? data.post : item)))
      setCommentDrafts((current) => ({ ...current, [postId]: "" }))
    } catch (error) {
      notify(error.message)
    }
  }

  function startReply(postId, rootId, focusId, author) {
    if (!asUser()) return
    setReplyTarget((current) => (
      current?.postId === postId && current?.focusId === focusId ? null : { postId, rootId, focusId, author }
    ))
  }

  async function addReply(postId, rootId) {
    if (!asUser()) return
    const text = (replyDrafts[rootId] || "").trim()
    if (!text) return
    try {
      const data = await api(`/api/posts/${postId}/comments`, { method: "POST", body: { text, parent_id: rootId } })
      setFeed((current) => current.map((item) => (item.id === postId ? data.post : item)))
      setReplyDrafts((current) => ({ ...current, [rootId]: "" }))
      setReplyTarget(null)
    } catch (error) {
      notify(error.message)
    }
  }

  return (
    <>
      <PageHero
        compact
        eyebrow="The room after"
        title="Music community"
        subtitle="A feed for sets, lessons, and the notes people leave when the house lights come up."
        ornament="/images/violin.svg"
      />
      <Container className="grid gap-6 pt-6 pb-10 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className="h-fit rounded-3xl border border-white/10 bg-panel p-4 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Trending</p>
          <ul className="mt-3 space-y-2">
            {topics.map((topic) => (
              <li key={topic.tag} className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-white/5">
                <span className="text-sm text-white">#{topic.tag}</span>
                <span className="text-xs text-zinc-500">{topic.posts}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-4">
          {canPost ? (
          <form onSubmit={publish} className="rounded-3xl border border-white/10 bg-panel p-4">
            <div className="flex gap-3">
              <Avatar user={user} className="h-11 w-11 text-sm" />
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                placeholder="Share a set, a lesson, or a room you loved"
                className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>
            {photo && <Cover src={photo} alt="" className="mt-3 h-40 w-full rounded-2xl" />}
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
              <button type="button" onClick={() => setPicker(true)} className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
                <ImagePlus className="h-4 w-4" /> Photo
              </button>
              <Button type="submit">Post</Button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Posting as {user.name}.</p>
          </form>
          ) : (
            <SignInPrompt
              signedIn={Boolean(user)}
              title="Sign in to share a post"
              text="The feed stays open to read. Photos, likes, and comments use a user account."
            />
          )}

          {!settled && feed.length === 0 && <div className="h-40 animate-pulse rounded-3xl bg-white/60" />}
          {feed.map((post) => {
            const isLiked = Boolean(post.liked)
            const likeCount = post.likes
            const commentsOpen = Boolean(openComments[post.id])
            return (
              <article key={post.id} className="rounded-3xl border border-white/10 bg-panel p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <Cover src={post.avatar} alt="" className="h-11 w-11 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {post.author} <span className="font-normal text-zinc-500">{post.handle}</span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      {post.time} · {post.share ? "Shared" : post.topic}
                    </p>
                  </div>
                </div>
                {post.text ? <p className="mt-4 text-sm leading-7 text-zinc-200">{post.text}</p> : null}
                {post.share ? <SharedCard post={post.share} /> : post.image ? <Cover src={post.image} alt="" className="mt-4 max-h-96 w-full rounded-2xl" /> : null}
                <div className="mt-4 flex gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={() => toggleLike(post)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${isLiked ? "text-rose-300" : "text-zinc-300 hover:bg-white/5"}`}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} /> {likeCount}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenComments((current) => ({ ...current, [post.id]: !current[post.id] }))}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
                  >
                    <MessageCircle className="h-4 w-4" /> {threadCount(post)}
                  </button>
                  {!(post.mine && !post.share) && (
                    <button
                      type="button"
                      onClick={() => openShare(post)}
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
                    >
                      <Share2 className="h-4 w-4" /> {post.shares ? post.shares : "Share"}
                    </button>
                  )}
                  {post.mine && (
                    <button
                      type="button"
                      onClick={() => removePost(post)}
                      className="ml-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-[#9f1239]"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  )}
                </div>
                {commentsOpen && (
                  <div className="mt-3 space-y-3">
                    {post.comments.map((comment) => {
                      const replyingHere = replyTarget?.postId === post.id && replyTarget?.focusId === comment.id
                      return (
                        <div key={comment.id} className="space-y-2">
                          <div className="flex gap-3">
                            <Cover src={comment.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full" />
                            <div>
                              <div className="rounded-2xl bg-white/5 px-3 py-2">
                                <p className="text-xs text-zinc-400">
                                  {comment.author} · {comment.time}
                                </p>
                                <p className="text-sm text-zinc-200">{comment.text}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => startReply(post.id, comment.id, comment.id, comment.author)}
                                className="mt-1 px-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                          {(comment.replies || []).map((reply) => {
                            const replyingToReply = replyTarget?.postId === post.id && replyTarget?.focusId === reply.id
                            return (
                              <div key={reply.id} className="space-y-2">
                                <div className="ml-11 flex gap-3">
                                  <Cover src={reply.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full" />
                                  <div>
                                    <div className="rounded-2xl bg-white/5 px-3 py-2">
                                      <p className="text-xs text-zinc-400">
                                        {reply.author} · {reply.time}
                                      </p>
                                      <p className="text-sm text-zinc-200">{reply.text}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => startReply(post.id, comment.id, reply.id, reply.author)}
                                      className="mt-1 px-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
                                    >
                                      Reply
                                    </button>
                                  </div>
                                </div>
                                {replyingToReply && (
                                  <ReplyComposer
                                    user={user}
                                    author={reply.author}
                                    value={replyDrafts[comment.id] || ""}
                                    onChange={(event) => setReplyDrafts((current) => ({ ...current, [comment.id]: event.target.value }))}
                                    onSend={() => addReply(post.id, comment.id)}
                                  />
                                )}
                              </div>
                            )
                          })}
                          {replyingHere && (
                            <ReplyComposer
                              user={user}
                              author={comment.author}
                              value={replyDrafts[comment.id] || ""}
                              onChange={(event) => setReplyDrafts((current) => ({ ...current, [comment.id]: event.target.value }))}
                              onSend={() => addReply(post.id, comment.id)}
                            />
                          )}
                        </div>
                      )
                    })}
                    <div className="flex gap-2">
                      <Avatar user={user} className="h-8 w-8 shrink-0 text-[11px]" />
                      <input
                        value={commentDrafts[post.id] || ""}
                        onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                        placeholder="Write a comment"
                        className="w-full rounded-full border border-white/10 bg-ink px-4 py-2 text-sm outline-none"
                      />
                      <Button onClick={() => addComment(post.id)}>Send</Button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-panel p-4 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Members</p>
          <ul className="mt-3 space-y-3">
            {user && (
              <li className="flex items-center gap-3">
                <Avatar user={user} className="h-10 w-10 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{user.name}</p>
                  <p className="text-xs text-zinc-500">You</p>
                </div>
              </li>
            )}
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3">
                <Cover src={member.avatar} alt="" className="h-10 w-10 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{member.name}</p>
                  <p className="text-xs text-zinc-500">
                    {member.role} · {member.city}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!asUser()) return
                    try {
                      const data = await api(`/api/members/${member.id}/follow`, { method: "POST" })
                      setMembers((current) => current.map((item) => (item.id === member.id ? { ...item, following: data.following } : item)))
                    } catch (error) {
                      notify(error.message)
                    }
                  }}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-200 hover:bg-white/8"
                >
                  {member.following ? "Following" : "Follow"}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </Container>
      <Modal open={picker} title="Add a photo" subtitle="Your profile photo stays beside the post. Choose a picture to show underneath." onClose={() => setPicker(false)}>
        <div className="mb-4 flex items-center gap-3">
          <Avatar user={user} className="h-12 w-12 text-sm" />
          <div>
            <p className="text-sm font-medium text-[#1c1416]">{user?.name}</p>
            <p className="text-xs text-[#57534e]">Posting as you</p>
          </div>
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-full border border-[#e7e5e4] bg-[#ffffff] px-4 py-2 text-sm font-semibold text-[#1c1416] shadow-sm hover:bg-[#f5f5f4]">
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={chooseFile} />
          {uploading ? "Uploading…" : "Upload a photo"}
        </label>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {photoChoices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => setPhoto(choice.src)}
              className={`overflow-hidden rounded-xl ring-2 ${photo === choice.src ? "ring-[#1c1416]" : "ring-transparent"}`}
            >
              <Cover src={choice.src} alt="" className="h-16 w-full" />
            </button>
          ))}
        </div>
        {photo && <Cover src={photo} alt="" className="mt-4 h-40 w-full rounded-2xl" />}
        <div className="mt-5 flex justify-end">
          <Button type="button" onClick={() => setPicker(false)}>
            {photo ? "Use this photo" : "Close"}
          </Button>
        </div>
      </Modal>
      <Modal
        open={Boolean(shareTarget)}
        title="Share to your feed"
        subtitle="Your name goes on the feed, with their post underneath."
        onClose={() => setShareTarget(null)}
      >
        <textarea
          value={shareNote}
          onChange={(event) => setShareNote(event.target.value)}
          rows={3}
          placeholder="Say something about this"
          className="w-full resize-none rounded-2xl border border-[#ead7da] bg-[#fffdfb] px-3 py-3 text-sm text-[#1c1416] outline-none placeholder:text-[#a89499]"
        />
        <SharedCard post={shareTarget?.share?.author ? shareTarget.share : shareTarget} />
        <div className="mt-5 flex justify-end">
          <Button type="button" onClick={confirmShare} disabled={sharing}>
            {sharing ? "Sharing…" : "Share"}
          </Button>
        </div>
      </Modal>
    </>
  )
}
