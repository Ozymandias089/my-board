"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// 마크다운 프리뷰까지 넣고 싶으면 NewPostPage에서 가져다가 확장 가능
// 여기서는 일단 간단한 버전으로.

type EditablePost = {
  id: number;
  handle: string;
  title: string;
  content: string;
};

interface EditPostFormProps {
  post: EditablePost;
}

export function EditPostForm({ post }: EditPostFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    content?: string;
  }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    const newFieldErrors: typeof fieldErrors = {};

    if (!trimmedTitle) {
      newFieldErrors.title = "Title is required.";
    }
    if (!trimmedContent) {
      newFieldErrors.content = "Content is required.";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          data?.error?.message || "Failed to update the post.";
        setError(message);
        return;
      }

      // 성공 → 상세 페이지로 이동
      router.push(`/posts/${post.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[900px]">
        <Card className="w-full shadow-sm border border-border/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold">
              Edit post
            </CardTitle>
            <CardDescription>
              You can edit this post within 3 days from creation.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 pb-6">
            <form onSubmit={onSubmit} className="w-full">
              <div className="space-y-6 w-full">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Handle은 수정 안 함 (고정 정보로만 표시) */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Author handle
                  </Label>
                  <p className="text-sm">{post.handle}</p>
                </div>

                {/* Title */}
                <div className="space-y-2 w-full">
                  <Label htmlFor="title" className="text-sm font-semibold">
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter a short title for your post"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={submitting}
                    className={`w-full ${
                      fieldErrors.title
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                    aria-invalid={!!fieldErrors.title}
                    aria-describedby={
                      fieldErrors.title ? "title-error" : undefined
                    }
                  />
                  {fieldErrors.title && (
                    <p
                      id="title-error"
                      className="text-xs text-destructive mt-1"
                    >
                      {fieldErrors.title}
                    </p>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-2 w-full">
                  <Label htmlFor="content" className="text-sm font-semibold">
                    Content
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Update your post content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={submitting}
                    className={`w-full min-h-[220px] sm:min-h-[280px] resize-y ${
                      fieldErrors.content
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                    rows={10}
                    aria-invalid={!!fieldErrors.content}
                    aria-describedby={
                      fieldErrors.content ? "content-error" : undefined
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports basic Markdown (headings, lists, **bold**,
                    _italic_, etc.).
                  </p>
                  {fieldErrors.content && (
                    <p
                      id="content-error"
                      className="text-xs text-destructive mt-1"
                    >
                      {fieldErrors.content}
                    </p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={submitting}
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
