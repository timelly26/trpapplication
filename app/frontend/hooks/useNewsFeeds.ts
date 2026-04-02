"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface NewsFeedItem {
  id: string;
  title: string;
  description: string;
  photo: string | null;
  photos?: string[];
  likes: number;
  likedByMe: boolean;
  createdBy: { id: string; name: string | null; email: string | null; photoUrl?: string | null };
  createdAt: string;
}

export function useNewsFeeds() {
  const [feeds, setFeeds] = useState<NewsFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likingIds, setLikingIds] = useState<Record<string, boolean>>({});
  const feedsRef = useRef<NewsFeedItem[]>([]);
  const likingIdsRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    feedsRef.current = feeds;
  }, [feeds]);

  useEffect(() => {
    likingIdsRef.current = likingIds;
  }, [likingIds]);

  const fetchFeeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/newsfeed/list", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load news feed");
      const list = Array.isArray(data.newsFeeds) ? data.newsFeeds : [];
      setFeeds(
        list.map((f: Record<string, unknown>) => ({
          id: String(f.id ?? ""),
          title: String(f.title ?? ""),
          description: String(f.description ?? ""),
          photo: typeof f.photo === "string" ? f.photo : typeof f.mediaUrl === "string" ? f.mediaUrl : null,
          photos: Array.isArray(f.photos) ? f.photos : undefined,
          likes: typeof f.likes === "number" ? f.likes : 0,
          likedByMe: Boolean(f.likedByMe),
          createdBy:
            f.createdBy && typeof f.createdBy === "object"
              ? {
                  id: String((f.createdBy as { id?: unknown }).id ?? ""),
                  name: (f.createdBy as { name?: string | null }).name ?? null,
                  email: (f.createdBy as { email?: string | null }).email ?? null,
                  photoUrl: (f.createdBy as { photoUrl?: string | null }).photoUrl ?? null,
                }
              : { id: "", name: null, email: null },
          createdAt: typeof f.createdAt === "string" ? f.createdAt : new Date().toISOString(),
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading news feed");
      setFeeds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const toggleLike = useCallback(async (id: string) => {
    const currentFeed = feedsRef.current.find((feed) => feed.id === id);
    if (!currentFeed || likingIdsRef.current[id]) return;

    const nextLiked = !currentFeed.likedByMe;
    const nextLikes = Math.max(0, currentFeed.likes + (nextLiked ? 1 : -1));

    setLikingIds((prev) => ({ ...prev, [id]: true }));
    setFeeds((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, likedByMe: nextLiked, likes: nextLikes }
          : f
      )
    );

    try {
      const res = await fetch(`/api/newsfeed/${id}/like`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update like");
      setFeeds((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                likes: typeof data.likes === "number" ? data.likes : nextLikes,
                likedByMe: typeof data.liked === "boolean" ? data.liked : nextLiked,
              }
            : f
        )
      );
    } catch {
      setFeeds((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, likedByMe: currentFeed.likedByMe, likes: currentFeed.likes }
            : f
        )
      );
    } finally {
      setLikingIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, []);

  return { feeds, loading, error, refetch: fetchFeeds, toggleLike, likingIds };
}
