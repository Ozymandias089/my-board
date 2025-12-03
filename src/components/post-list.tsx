"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Prisma에서 오는 Post 타입을 대략적으로 정의
// (createdAt은 서버/클라 직렬화 과정에서 string으로 들어올 가능성이 커서 union)
type Post = {
  id: number;
  handle: string;
  title: string;
  content: string;
  createdAt: string | Date;
};

interface PostListProps {
  initialPosts: Post[];
  initialNextCursor: number | null;
  initialHasMore: boolean;
}

const PAGE_SIZE = 10;

export function PostList({
  initialPosts,
  initialNextCursor,
  initialHasMore,
}: PostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<number | null>(initialNextCursor);
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
        limit: String(PAGE_SIZE),
      });

      const res = await fetch(`/api/posts?${params.toString()}`, {
        method: "GET",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          data?.error?.message || "Failed to load more posts.";
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
          // 살짝 늦게 호출해서 중복 트리거 줄이기
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "200px 0px", // 200px 전에 미리 불러오기
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
          const createdAt =
            typeof post.createdAt === "string"
              ? new Date(post.createdAt)
              : post.createdAt;

          const preview =
            post.content.length > 100
              ? post.content.slice(0, 100) + "..."
              : post.content;

          return (
            <Link key={post.id} href={`/posts/${post.id}`} className="block">
              <Card className="hover:bg-accent/60 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {post.handle} · {createdAt.toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {preview}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })
      )}

      {/* 무한스크롤용 sentinel + 로딩/에러 표시 영역 */}
      <div ref={sentinelRef} className="h-10">
        {/* sentinel 자체는 눈에 안 보여도 되지만, 안쪽에서 로딩/에러를 같이 표시하면 편함 */}
      </div>

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
        <p className="text-xs text-destructive text-center mt-2">
          {loadError}
        </p>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          You&apos;ve reached the end.
        </p>
      )}
    </section>
  );
}
