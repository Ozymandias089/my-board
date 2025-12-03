import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PostActionsMenu } from "@/components/post-actions-menu";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) notFound();

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        {/* 뒤로가기 */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to posts
        </Link>

        {/* 상세 카드 */}
        <Card className="w-full border shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl font-semibold">
                {post.title}
              </CardTitle>
              <CardDescription className="text-sm">
                {post.handle} · {new Date(post.createdAt).toLocaleString()}
              </CardDescription>
            </div>

            <PostActionsMenu postId={post.id} createdAt={post.createdAt} />
          </CardHeader>

          <CardContent>
            <article className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => (
                    <p
                      className="whitespace-pre-wrap leading-relaxed"
                      {...props}
                    />
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </article>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
