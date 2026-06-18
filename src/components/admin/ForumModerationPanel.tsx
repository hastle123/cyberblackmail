"use client";

import { useCallback, useEffect, useState } from "react";

type PendingTopic = {
  id: string;
  slug: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  category: { slug: string; name: string };
};

type PendingPost = {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
  topic: { slug: string; title: string };
};

export function ForumModerationPanel() {
  const [topics, setTopics] = useState<PendingTopic[]>([]);
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/forum/moderate");
      if (res.status === 401) {
        window.location.href = "/admin/login?next=/admin/forum";
        return;
      }
      const json = await res.json();
      setTopics(json.data?.topics ?? []);
      setPosts(json.data?.posts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  async function moderate(type: "topic" | "post", id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/forum/moderate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, action }),
      });
      if (res.ok) await loadQueue();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[#888]">
          {loading ? "Loading…" : `${topics.length} topics · ${posts.length} replies pending`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadQueue()}
            className="rounded border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#a3a3a3] hover:text-[#f0f0f0]"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/login", { method: "DELETE" });
              window.location.href = "/admin/login";
            }}
            className="rounded border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] hover:text-[#f0f0f0]"
          >
            Sign out
          </button>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-[#c41e1e]">
          Pending topics
        </h2>
        {topics.length === 0 ? (
          <p className="glass-panel rounded-xl p-4 text-sm text-[#888]">No topics waiting.</p>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => (
              <article key={topic.id} className="glass-panel rounded-xl p-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#888]">
                  {topic.category.name} · {topic.authorName} · {new Date(topic.createdAt).toLocaleString()}
                </p>
                <h3 className="mt-2 font-serif text-lg font-semibold text-[#f0f0f0]">{topic.title}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#c4c4c4]">{topic.content}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === topic.id}
                    onClick={() => moderate("topic", topic.id, "approve")}
                    className="rounded bg-[#1a4d2e] px-4 py-2 text-sm font-semibold text-[#7dcea0] hover:bg-[#236b3d] disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === topic.id}
                    onClick={() => moderate("topic", topic.id, "reject")}
                    className="rounded border border-[#c41e1e]/40 px-4 py-2 text-sm font-semibold text-[#e52525] hover:bg-[#c41e1e]/10 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-[#c41e1e]">
          Pending replies
        </h2>
        {posts.length === 0 ? (
          <p className="glass-panel rounded-xl p-4 text-sm text-[#888]">No replies waiting.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post.id} className="glass-panel rounded-xl p-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#888]">
                  Re: {post.topic.title} · {post.authorName} · {new Date(post.createdAt).toLocaleString()}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#c4c4c4]">{post.content}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === post.id}
                    onClick={() => moderate("post", post.id, "approve")}
                    className="rounded bg-[#1a4d2e] px-4 py-2 text-sm font-semibold text-[#7dcea0] hover:bg-[#236b3d] disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === post.id}
                    onClick={() => moderate("post", post.id, "reject")}
                    className="rounded border border-[#c41e1e]/40 px-4 py-2 text-sm font-semibold text-[#e52525] hover:bg-[#c41e1e]/10 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
