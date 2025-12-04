import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostList } from "@/components/post-list";
import { Button } from "@/components/ui/button";
import { POSTS_PAGE_SIZE } from "@/lib/constants";

export default async function Home() {
  // 서버 컴포넌트에서 직접 DB 읽어오기
  const posts = await prisma.post.findMany({
    orderBy: { id: "desc" },
    take: POSTS_PAGE_SIZE,
  });

  const postIds = posts.map((p) => p.id);

  const commentCounts =
    postIds.length === 0
      ? []
      : await prisma.comment.groupBy({
          by: ["postId"],
          where: {
            postId: { in: postIds },
            isDeleted: false,
          },
          _count: {
            _all: true,
          },
        });

  const countMap = new Map<number, number>();
  for (const row of commentCounts) {
    countMap.set(row.postId, row._count._all);
  }

  const postsWithComments = posts.map((post) => ({
    ...post,
    commentsCount: countMap.get(post.id) ?? 0,
  }));

  const nextCursor = posts.length === POSTS_PAGE_SIZE ? posts[posts.length - 1].id : null;
  const hasMore = posts.length === POSTS_PAGE_SIZE;

  return (
    <main className="min-h-screen bg-background text-foreground py-4 py-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        {/* 헤더 영역 */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Latest posts</h1>
          <Button asChild>
            <Link href="/posts/new">Write a new Post</Link>
          </Button>
        </header>

        {/* 게시글 목록 영역 */}
        <PostList
          initialPosts={postsWithComments}
          initialNextCursor={nextCursor}
          initialHasMore={hasMore}
        />
      </div>
    </main>
  );
}
