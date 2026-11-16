import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { toast } from "react-toastify";
import Head from "next/head";
import Link from "next/link";
import { auth } from "@/firebase/firebase";

const API = process.env.NEXT_PUBLIC_API_URL || "https://internshala-clone-ahv9.onrender.com/api";

export default function CommunityPage() {
  const user = useSelector(selectuser);

  const [activeTab, setActiveTab] = useState<"feed" | "myposts" | "friends" | "notifications">("feed");
  const [friendPosts, setFriendPosts] = useState<any[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchUsers, setSearchUsers] = useState<any[]>([]);
  const [friendEmail, setFriendEmail] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postMediaUrl, setPostMediaUrl] = useState("");
  const [postMediaType, setPostMediaType] = useState("text");
  const [postPrivacy, setPostPrivacy] = useState("public");
  const [creating, setCreating] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const getToken = async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return null;
    try {
      return await fbUser.getIdToken();
    } catch {
      return null;
    }
  };

  const authHeaders = async () => {
    const token = await getToken();
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  };

  useEffect(() => {
    if (activeTab === "feed") fetchFeed();
    if (activeTab === "myposts") fetchMyPosts();
    if (activeTab === "friends") { fetchFriends(); fetchPendingRequests(); }
    if (activeTab === "notifications") fetchNotifications();
  }, [activeTab]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      if (user) {
        const headers = await authHeaders();
        const res = await fetch(`${API}/posts/feed`, { headers });
        if (res.ok) {
          const data = await res.json();
          setFriendPosts(data.friendPosts || []);
          setTrendingPosts(data.trendingPosts || []);
        }
      } else {
        const res = await fetch(`${API}/posts/all`);
        if (res.ok) {
          const data = await res.json();
          setTrendingPosts(data.posts || []);
        }
      }
    } catch (err) {
      console.log("Feed error", err);
    }
    setLoading(false);
  };

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/posts/my/posts`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMyPosts(data.posts || []);
      }
    } catch (err) {
      toast.error("Failed to load your posts");
    }
    setLoading(false);
  };

  const fetchFriends = async () => {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/friends/list`, { headers });
      if (res.ok) { const data = await res.json(); setFriends(data.friends || []); }
    } catch (err) { console.log(err); }
  };

  const fetchPendingRequests = async () => {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/friends/pending`, { headers });
      if (res.ok) { const data = await res.json(); setPendingRequests(data.requests || []); }
    } catch (err) { console.log(err); }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/posts/notifications/my`, { headers });
      if (res.ok) { const data = await res.json(); setNotifications(data.notifications || []); }
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  const handleCreatePost = async () => {
    if (!user) { toast.error("Please login to create posts"); return; }
    if (!postContent.trim() && !postMediaUrl.trim()) { toast.error("Post cannot be empty"); return; }
    setCreating(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/posts/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: postContent, mediaUrl: postMediaUrl, mediaType: postMediaType, privacySettings: postPrivacy }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Post created!");
        setPostContent(""); setPostMediaUrl(""); setPostMediaType("text");
        fetchFeed(); fetchMyPosts();
      } else { toast.error(data.error || "Failed to create post"); }
    } catch (err) { toast.error("Server error"); }
    setCreating(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) { toast.error("Login to like posts"); return; }
    try {
      const headers = await authHeaders();
      await fetch(`${API}/posts/${postId}/like`, { method: "POST", headers });
      fetchFeed();
      if (activeTab === "myposts") fetchMyPosts();
    } catch (err) { console.log(err); }
  };

  const handleComment = async (postId: string) => {
    if (!user) { toast.error("Login to comment"); return; }
    const text = commentInputs[postId];
    if (!text || !text.trim()) { toast.error("Comment cannot be empty"); return; }
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/posts/${postId}/comment`, {
        method: "POST", headers, body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Comment added!");
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        fetchFeed();
        if (activeTab === "myposts") fetchMyPosts();
      } else { toast.error(data.error); }
    } catch (err) { console.log(err); }
  };

  const handleShare = async (postId: string) => {
    if (!user) { toast.error("Login to share"); return; }
    try {
      const headers = await authHeaders();
      await fetch(`${API}/posts/${postId}/share`, { method: "POST", headers });
      toast.success("Post shared!");
    } catch (err) { console.log(err); }
  };

  const handleSave = async (postId: string) => {
    if (!user) { toast.error("Login to save"); return; }
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/posts/${postId}/save`, { method: "POST", headers });
      const data = await res.json();
      toast.success(data.message || "Done");
    } catch (err) { console.log(err); }
  };

  const handleReport = async (postId: string) => {
    if (!user) { toast.error("Login to report"); return; }
    if (!confirm("Report this post?")) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/posts/${postId}/report`, { method: "POST", headers });
      const data = await res.json();
      toast.success(data.message || "Reported");
    } catch (err) { console.log(err); }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/posts/${postId}`, { method: "DELETE", headers });
      const data = await res.json();
      if (res.ok) { toast.success("Post deleted"); fetchMyPosts(); fetchFeed(); }
      else { toast.error(data.error); }
    } catch (err) { console.log(err); }
  };

  const handleEditSave = async (postId: string) => {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/posts/${postId}/edit`, {
        method: "PUT", headers, body: JSON.stringify({ content: editContent }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("Post updated!"); setEditingPostId(null); fetchMyPosts(); fetchFeed(); }
      else { toast.error(data.error); }
    } catch (err) { console.log(err); }
  };

  const handleSendFriendRequest = async (emailArg?: string) => {
    const target = emailArg || friendEmail;
    if (!target.trim()) { toast.error("Enter email"); return; }
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/friends/request`, {
        method: "POST", headers, body: JSON.stringify({ receiverEmail: target }),
      });
      const data = await res.json();
      if (res.ok) { toast.success(data.message); setFriendEmail(""); }
      else { toast.error(data.error); }
    } catch (err) { console.log(err); }
  };

  const handleRespondRequest = async (friendshipId: string, action: "accept" | "reject") => {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/friends/respond`, {
        method: "POST", headers, body: JSON.stringify({ friendshipId, action }),
      });
      const data = await res.json();
      if (res.ok) { toast.success(data.message); fetchPendingRequests(); fetchFriends(); }
      else { toast.error(data.error); }
    } catch (err) { console.log(err); }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/friends/users/search?q=${encodeURIComponent(searchQuery)}`, { headers });
      if (res.ok) { const data = await res.json(); setSearchUsers(data.users || []); }
    } catch (err) { console.log(err); }
  };

  const handleSearchPosts = async () => {
    try {
      const res = await fetch(`${API}/posts/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) { const data = await res.json(); setSearchResults(data.posts || []); }
    } catch (err) { console.log(err); }
  };

  const handleMarkAllRead = async () => {
    try {
      const headers = await authHeaders();
      await fetch(`${API}/posts/notifications/read-all`, { method: "POST", headers });
      fetchNotifications();
      toast.success("All marked as read");
    } catch (err) { console.log(err); }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString("en-IN");
  };

  const PostCard = ({ post, showOwnerActions }: { post: any; showOwnerActions?: boolean }) => {
    const userEmail = user?.email;
    const isOwner = userEmail ? post.userId?.email === userEmail : false;

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <img
              src={post.userId?.photo || "https://ui-avatars.com/api/?name=" + encodeURIComponent(post.userId?.name || "U")}
              alt={post.userId?.name}
              className="w-9 h-9 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-sm text-gray-800">{post.userId?.name || "Unknown"}</p>
              <p className="text-xs text-gray-500">{formatTime(post.createdAt)} {post.isEdited && "· edited"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="bg-gray-100 px-2 py-0.5 rounded-full">{post.privacySettings}</span>
            {showOwnerActions && isOwner && (
              <>
                {editingPostId !== post._id && (
                  <button onClick={() => { setEditingPostId(post._id); setEditContent(post.content); }} className="text-blue-500 hover:underline">Edit</button>
                )}
                <button onClick={() => handleDelete(post._id)} className="text-red-500 hover:underline">Delete</button>
              </>
            )}
          </div>
        </div>

        {/* Edit mode */}
        {editingPostId === post._id ? (
          <div className="mb-3">
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-none" rows={3} />
            <div className="flex gap-2 mt-1">
              <button onClick={() => handleEditSave(post._id)} className="px-3 py-1 bg-blue-600 text-white rounded text-xs">Save</button>
              <button onClick={() => setEditingPostId(null)} className="px-3 py-1 bg-gray-200 rounded text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {post.content && (
              <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">
                {post.content.split(/(\s+)/).map((word: string, i: number) => {
                  if (word.startsWith("#")) return <span key={i} className="text-blue-500">{word}</span>;
                  if (word.startsWith("@")) return <span key={i} className="text-green-600 font-medium">{word}</span>;
                  return word;
                })}
              </p>
            )}
            {post.mediaUrl && post.mediaType === "photo" && (
              <img src={post.mediaUrl} alt="media" className="rounded-lg w-full max-h-80 object-cover mb-2" />
            )}
            {post.mediaUrl && post.mediaType === "video" && (
              <video src={post.mediaUrl} controls className="rounded-lg w-full mb-2" />
            )}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {post.hashtags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">#{tag}</span>
                ))}
              </div>
            )}
          </>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 border-t pt-2 mt-2">
          <span>👁 {post.viewCount}</span>
          <span>❤️ {post.likes?.length || 0}</span>
          <span>💬 {post.comments?.length || 0}</span>
          <span>🔁 {post.shares}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <button onClick={() => handleLike(post._id)} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
            🤍 Like
          </button>
          <button onClick={() => setShowComments((prev) => ({ ...prev, [post._id]: !prev[post._id] }))} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs border border-gray-200 text-gray-600 hover:bg-gray-50">
            💬 Comment
          </button>
          <button onClick={() => handleShare(post._id)} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs border border-gray-200 text-gray-600 hover:bg-gray-50">
            🔁 Share
          </button>
          <button onClick={() => handleSave(post._id)} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs border border-gray-200 text-gray-600 hover:bg-gray-50">
            🔖 Save
          </button>
          {!isOwner && (
            <button onClick={() => handleReport(post._id)} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs border border-gray-200 text-gray-500 hover:bg-red-50">
              🚩 Report
            </button>
          )}
        </div>

        {/* Comments */}
        {showComments[post._id] && (
          <div className="mt-3">
            {post.comments && post.comments.length > 0 && (
              <div className="mb-2 max-h-40 overflow-y-auto space-y-2">
                {post.comments.map((c: any) => (
                  <div key={c._id} className="flex items-start gap-2">
                    <img src={c.userId?.photo || "https://ui-avatars.com/api/?name=" + encodeURIComponent(c.userId?.name || "U")} className="w-6 h-6 rounded-full" alt="" />
                    <div className="bg-gray-50 rounded-lg px-2 py-1 flex-1">
                      <p className="text-xs font-semibold text-gray-700">{c.userId?.name}</p>
                      <p className="text-xs text-gray-600">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {user && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment... (@mention #hashtag)"
                  value={commentInputs[post._id] || ""}
                  onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleComment(post._id); }}
                  className="flex-1 border border-gray-200 rounded-full px-3 py-1 text-xs"
                />
                <button onClick={() => handleComment(post._id)} className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs">Post</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Head><title>Community – Public Space</title></Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Community</h1>
          <p className="text-sm text-gray-500 mb-4">Connect, share, and explore posts from your friends and the community.</p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b overflow-x-auto">
            {(["feed", "myposts", "friends", "notifications"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}
              >
                {tab === "feed" ? "📰 Feed" : tab === "myposts" ? "📝 My Posts" : tab === "friends" ? "👥 Friends" : "🔔 Notifications"}
              </button>
            ))}
          </div>

          {/* FEED TAB */}
          {activeTab === "feed" && (
            <div>
              {/* Search */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search posts by keyword or #hashtag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearchPosts(); }}
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm"
                />
                <button onClick={handleSearchPosts} className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm">Search</button>
                {searchResults.length > 0 && (
                  <button onClick={() => { setSearchResults([]); setSearchQuery(""); }} className="px-3 py-2 bg-gray-200 rounded-full text-sm">Clear</button>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Search Results ({searchResults.length})</h3>
                  {searchResults.map((post) => <PostCard key={post._id} post={post} />)}
                </div>
              )}

              {/* Create post */}
              {user ? (
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Create a Post</p>
                  <textarea
                    placeholder="What's on your mind? Use @username to mention, #hashtag to tag topics..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none mb-2"
                    rows={3}
                  />
                  <div className="flex flex-wrap gap-2 items-center">
                    <select value={postMediaType} onChange={(e) => setPostMediaType(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs">
                      <option value="text">📝 Text Only</option>
                      <option value="photo">🖼️ Photo</option>
                      <option value="video">🎥 Video</option>
                    </select>
                    {(postMediaType === "photo" || postMediaType === "video") && (
                      <input type="url" placeholder={postMediaType === "photo" ? "Photo URL" : "Video URL"} value={postMediaUrl} onChange={(e) => setPostMediaUrl(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs flex-1 min-w-[200px]" />
                    )}
                    <select value={postPrivacy} onChange={(e) => setPostPrivacy(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs">
                      <option value="public">🌐 Public</option>
                      <option value="friends">👥 Friends only</option>
                    </select>
                    <button onClick={handleCreatePost} disabled={creating} className="ml-auto px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium disabled:opacity-50">
                      {creating ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-center text-sm text-blue-700">
                  <Link href="/" className="font-semibold hover:underline">Log in</Link> to create posts and interact with the community.
                </div>
              )}

              {loading ? (
                <div className="text-center py-10 text-gray-400">Loading feed...</div>
              ) : (
                <>
                  {friendPosts.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">From Your Friends</h3>
                      {friendPosts.map((post) => <PostCard key={post._id} post={post} />)}
                    </div>
                  )}
                  {trendingPosts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                        {friendPosts.length > 0 ? "Trending & Recent" : "Public Posts"}
                      </h3>
                      {trendingPosts.map((post) => <PostCard key={post._id} post={post} />)}
                    </div>
                  )}
                  {friendPosts.length === 0 && trendingPosts.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                      <p className="text-4xl mb-3">📭</p>
                      <p className="font-medium">No posts yet</p>
                      <p className="text-sm">Be the first to post! Add friends to unlock posting privileges.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* MY POSTS TAB */}
          {activeTab === "myposts" && (
            <div>
              {!user ? (
                <div className="text-center py-16 text-gray-400">Please log in to see your posts.</div>
              ) : loading ? (
                <div className="text-center py-10 text-gray-400">Loading...</div>
              ) : myPosts.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-4xl mb-3">📝</p>
                  <p className="font-medium">No posts yet</p>
                  <p className="text-sm">Add friends and start posting!</p>
                </div>
              ) : (
                myPosts.map((post) => <PostCard key={post._id} post={post} showOwnerActions />)
              )}
            </div>
          )}

          {/* FRIENDS TAB */}
          {activeTab === "friends" && (
            <div>
              {!user ? (
                <div className="text-center py-16 text-gray-400">Please log in to manage friends.</div>
              ) : (
                <>
                  {/* Send friend request */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Send Friend Request</p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Enter their email address..."
                        value={friendEmail}
                        onChange={(e) => setFriendEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSendFriendRequest(); }}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <button onClick={() => handleSendFriendRequest()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Send</button>
                    </div>
                  </div>

                  {/* Search users */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Find People</p>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSearchUsers(); }}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <button onClick={handleSearchUsers} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Search</button>
                    </div>
                    {searchUsers.length > 0 && (
                      <div className="space-y-2">
                        {searchUsers.map((u) => (
                          <div key={u._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <img src={u.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`} className="w-8 h-8 rounded-full" alt="" />
                              <div>
                                <p className="text-sm font-medium">{u.name}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                            </div>
                            <button onClick={() => handleSendFriendRequest(u.email)} className="text-xs px-3 py-1 bg-blue-600 text-white rounded-full">Add Friend</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pending requests */}
                  {pendingRequests.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Pending Requests ({pendingRequests.length})</p>
                      <div className="space-y-3">
                        {pendingRequests.map((req) => (
                          <div key={req._id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src={req.sender.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.sender.name)}`} className="w-9 h-9 rounded-full" alt="" />
                              <div>
                                <p className="text-sm font-medium">{req.sender.name}</p>
                                <p className="text-xs text-gray-500">{req.sender.email}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleRespondRequest(req._id, "accept")} className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs">Accept</button>
                              <button onClick={() => handleRespondRequest(req._id, "reject")} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">Reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Friends list */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      My Friends ({friends.length})
                      {friends.length === 0 && <span className="text-gray-400 font-normal ml-2">— Add friends to unlock posting</span>}
                    </p>
                    {friends.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-3xl mb-2">👥</p>
                        <p className="text-sm">No friends yet. Add friends to unlock posting!</p>
                        <div className="mt-3 text-xs bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left text-gray-600">
                          <p className="font-semibold mb-1">📋 Posting limits by friend count:</p>
                          <ul className="space-y-0.5">
                            <li>• 0 friends → Cannot post</li>
                            <li>• 1 friend → 1 post/day</li>
                            <li>• 2–5 friends → 2 posts/day</li>
                            <li>• 6–10 friends → 5 posts/day</li>
                            <li>• 10+ friends → Unlimited posts</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {friends.map((f) => (
                          <div key={f._id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <img src={f.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}`} className="w-9 h-9 rounded-full" alt="" />
                            <div>
                              <p className="text-sm font-medium">{f.name}</p>
                              <p className="text-xs text-gray-500">{f.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div>
              {!user ? (
                <div className="text-center py-16 text-gray-400">Please log in to see notifications.</div>
              ) : loading ? (
                <div className="text-center py-10 text-gray-400">Loading...</div>
              ) : (
                <>
                  {notifications.length > 0 && (
                    <div className="flex justify-end mb-3">
                      <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">Mark all as read</button>
                    </div>
                  )}
                  {notifications.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <p className="text-4xl mb-3">🔔</p>
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((n) => (
                        <div key={n._id} className={`flex items-center gap-3 p-3 rounded-xl border ${n.isRead ? "bg-white border-gray-100" : "bg-blue-50 border-blue-200"}`}>
                          <img src={n.fromUser?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.fromUser?.name || "U")}`} className="w-9 h-9 rounded-full flex-shrink-0" alt="" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{n.message}</p>
                            <p className="text-xs text-gray-400">{formatTime(n.createdAt)}</p>
                          </div>
                          {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
