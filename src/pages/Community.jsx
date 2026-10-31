import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Heart, ImagePlus, MessageCircle, Share2 } from "lucide-react"
import Button from "../components/ui/Button"
import Container from "../components/ui/Container"
import Cover from "../components/ui/Cover"
import PageHero from "../components/ui/PageHero"
import { members, posts as seedPosts, topics } from "../data/content"
import { useAppState } from "../context/AppState"
import { useTitle } from "../lib/useTitle"
import SignInPrompt from "../components/auth/SignInPrompt"

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
  const [feed, setFeed] = useState(seedPosts)
  const [draft, setDraft] = useState("")
  const [photo, setPhoto] = useState("")
  const [picker, setPicker] = useState(false)
  const [liked, setLiked] = useState({})
  const [openComments, setOpenComments] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [following, setFollowing] = useState({})

  function publish(event) {
    event.preventDefault()
    if (!asUser()) return
    if (!draft.trim()) {
      notify("Write something before posting.")
      return
    }
    const author = user?.name || "Guest user"
    setFeed((current) => [
      {
        id: `local-${crypto.randomUUID().slice(0, 8)}`,
        author,
        handle: "@you",
        avatar: user ? "/avatars/sam.svg" : "/avatars/james.svg",
        role: "Member",
        time: "Just now",
        topic: "Community",
        text: draft.trim(),
        image: photo,
        likes: 0,
        comments: [],
      },
      ...current,
    ])
    setDraft("")
    setPhoto("")
    setPicker(false)
    notify("Posted to this preview feed.")
  }

  function toggleLike(post) {
    if (!asUser()) return
    setLiked((current) => ({ ...current, [post.id]: !current[post.id] }))
  }

  function addComment(postId) {
    if (!asUser()) return
    const text = (commentDrafts[postId] || "").trim()
    if (!text) return
    setFeed((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: crypto.randomUUID(),
                  author: user?.name || "Guest",
                  avatar: "/avatars/sam.svg",
                  text,
                  time: "Just now",
                },
              ],
            }
          : post,
      ),
    )
    setCommentDrafts((current) => ({ ...current, [postId]: "" }))
  }

  return (
    <>
      <PageHero
        eyebrow="The room after"
        title="Music community"
        subtitle="A feed for sets, lessons, and the notes people leave when the house lights come up."
        ornament="/images/violin.svg"
      />
      <Container className="grid gap-6 py-10 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
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
              <Cover src={user ? "/avatars/sam.svg" : "/avatars/james.svg"} alt="" className="h-11 w-11 rounded-full" />
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                placeholder="Share a set, a lesson, or a room you loved"
                className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>
            {picker && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {photoChoices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => setPhoto(choice.src)}
                    className={`overflow-hidden rounded-xl ring-2 ${photo === choice.src ? "ring-violet-400" : "ring-transparent"}`}
                  >
                    <Cover src={choice.src} alt="" className="h-16 w-full" />
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
              <button type="button" onClick={() => setPicker((value) => !value)} className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
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

          {feed.map((post) => {
            const isLiked = Boolean(liked[post.id])
            const likeCount = post.likes + (isLiked ? 1 : 0)
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
                      {post.time} · {post.topic}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-200">{post.text}</p>
                {post.image && <Cover src={post.image} alt="" className="mt-4 max-h-96 w-full rounded-2xl" />}
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
                    <MessageCircle className="h-4 w-4" /> {post.comments.length}
                  </button>
                  <button
                    type="button"
                    onClick={() => notify("Link copied for this preview.")}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>
                {commentsOpen && (
                  <div className="mt-3 space-y-3">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Cover src={comment.avatar} alt="" className="h-8 w-8 rounded-full" />
                        <div className="rounded-2xl bg-white/5 px-3 py-2">
                          <p className="text-xs text-zinc-400">
                            {comment.author} · {comment.time}
                          </p>
                          <p className="text-sm text-zinc-200">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
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
                  onClick={() => {
                    if (!asUser()) return
                    setFollowing((current) => ({ ...current, [member.id]: !current[member.id] }))
                  }}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-200 hover:bg-white/8"
                >
                  {following[member.id] ? "Following" : "Follow"}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </Container>
    </>
  )
}
