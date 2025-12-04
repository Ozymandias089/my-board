"use client";

import { useCallback, useEffect, useRef, useState, MouseEvent } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { EDIT_WINDOW_MS, POSTS_PAGE_SIZE } from "@/lib/constants";

import { PostPreviewCard } from "./post-preview-card";
import { PostContextMenu } from "./mnu/post-context-menu";
// Prisma에서 오는 Post 타입을 대략적으로 정의
type Post = {
  id: number;
  handle: string;
  title: string;
  content: string;
  createdAt: string | Date;
  commentsCount: number;
};

interface PostListProps {
  initialPosts: Post[];
  initialNextCursor: number | null;
  initialHasMore: boolean;
}

export function PostList({
  initialPosts,
  initialNextCursor,
  initialHasMore,
}: PostListProps) {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<number | null>(
    initialNextCursor
  );
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursor) return;

    setLoadingMore(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams({
        cursor: String(nextCursor),
        limit: String(POSTS_PAGE_SIZE),
      });

      const res = await fetch(`/api/posts?${params.toString()}`, {
        method: "GET",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.error?.message || "Failed to load more posts.";
        setLoadError(message);
        return;
      }

      const data = await res.json();

      setPosts((prev) => [...prev, ...(data.items as Post[])]);
      setNextCursor(data.nextCursor ?? null);
      setHasMore(data.hasMore ?? false);
    } catch (err) {
      console.error(err);
      setLoadError("An unexpected error occurred while loading more posts.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, nextCursor]);

  // IntersectionObserver로 "진짜" 무한스크롤 구현
  useEffect(() => {
    if (!hasMore) return;

    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "200px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  return (
    <section className="flex flex-col gap-4">
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No posts available. Be the one to write new post!
        </p>
      ) : (
        posts.map((post) => {
          const handleDeleted = () => {
            setPosts((prev) => prev.filter((p) => p.id !== post.id));
          };

          return (
            <PostContextMenu
              key={post.id}
              post={post}
              onDeleted={handleDeleted}
            >
              <PostPreviewCard
                post={post}
                onDeleted={handleDeleted}
                onCommentsClick={(e: MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/posts/${post.id}#comments`);
                }}
              />
            </PostContextMenu>
          );
        })
      )}

      <div ref={sentinelRef} className="h-10" />

      {loadingMore && (
        <div className="space-y-4">
          <Card className="w-full border shadow-sm">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        </div>
      )}

      {loadError && (
        <p className="text-xs text-destructive text-center mt-2">{loadError}</p>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          You&apos;ve reached the end.
        </p>
      )}
    </section>
  );
}
