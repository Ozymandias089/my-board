"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

import { PostDeleteDialog } from "./post-delete-dialog";
import { Pencil, Trash2 } from "lucide-react";
import { PostActionsMenu } from "./post-actions-menu";

// Prisma에서 오는 Post 타입을 대략적으로 정의
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
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<number | null>(
    initialNextCursor
  );
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ★ 삭제 다이얼로그 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);

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
          const createdAt =
            typeof post.createdAt === "string"
              ? new Date(post.createdAt)
              : post.createdAt;

          const preview =
            post.content.length > 100
              ? post.content.slice(0, 100) + "..."
              : post.content;

          const EDIT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
          const canEdit = Date.now() - createdAt.getTime() <= EDIT_WINDOW_MS;

          return (
            <ContextMenu key={post.id}>
              <ContextMenuTrigger asChild>
                <Link href={`/posts/${post.id}`} className="block">
                  <Card className="relative hover:bg-accent/60 transition-colors cursor-pointer">
                    {/* 우측 상단 케밥 메뉴 */}
                    <div className="absolute top-2 right-2 z-10">
                      <PostActionsMenu
                        postId={post.id}
                        postTitle={post.title}
                        createdAt={post.createdAt}
                        onDeleted={() => {
                          // ★ 삭제 성공 시 리스트에서 해당 게시글 제거
                          setPosts((prev) =>
                            prev.filter((p) => p.id !== post.id)
                          );
                        }}
                      />
                    </div>

                    <CardHeader>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {post.handle} · {createdAt.toLocaleDateString()}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{preview}</p>
                    </CardContent>
                  </Card>
                </Link>
              </ContextMenuTrigger>

              {/* 우클릭/롱프레스 컨텍스트 메뉴 */}
              <ContextMenuContent>
                <ContextMenuItem
                  disabled={!canEdit}
                  onClick={() => {
                    if (!canEdit) return;
                    router.push(`/posts/${post.id}/edit`);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                  {!canEdit && (
                    <span className="ml-2 text-[10px] uppercase text-muted-foreground">
                      expired
                    </span>
                  )}
                </ContextMenuItem>
                <ContextMenuSeparator />

                <ContextMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    // 상세 페이지로 이동되는 기본 클릭 동작 방지
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteTarget(post);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
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
      {/* ★ 공용 삭제 AlertDialog */}
      <PostDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        postTitle={deleteTarget?.title ?? "this post"}
        onConfirm={async () => {
          if (!deleteTarget) return;

          try {
            const res = await fetch(`/api/posts/${deleteTarget.id}`, {
              method: "DELETE",
            });

            if (!res.ok) {
              const data = await res.json().catch(() => null);
              const message =
                data?.error?.message || "Failed to delete this post.";
              alert(message);
              return;
            }

            // ★ 목록에서 제거
            setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));

            setDeleteDialogOpen(false);
            setDeleteTarget(null);
          } catch (e) {
            console.error(e);
            alert("An unexpected error occurred while deleting the post.");
          }
        }}
      />
    </section>
  );
}
