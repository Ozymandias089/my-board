import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditPostForm } from "./EditPostForm";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { EDIT_WINDOW_MS } from "@/lib/constants";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    notFound();
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    notFound();
  }

  // ★ 서버에서 한 번 더 3일 제한 체크
  const now = new Date();
  const diffMs = now.getTime() - post.createdAt.getTime();

  if (diffMs > EDIT_WINDOW_MS) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">Edit window expired</h1>
          <p className="text-sm text-muted-foreground">
            This post can no longer be edited because the 3-day edit window has
            passed.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href={`/posts/${postId}`}>Back to post</Link>
          </Button>
        </div>
      </main>
    );
  }

  const serializedPost = {
    id: post.id,
    handle: post.handle,
    title: post.title,
    content: post.content,
  };

  return <EditPostForm post={serializedPost} />;
}
