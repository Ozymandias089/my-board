"use client";

import { useState, useRef, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type PostFormValues = {
  id?: number;
  handle: string;
  title: string;
  content: string;
};

interface PostEditorProps {
  mode: "create" | "edit";
  initialPost?: PostFormValues;
}

/**
 * 공용 게시글 작성/수정 에디터
 * - mode === "create": 새 글 작성
 * - mode === "edit": 기존 글 수정 (initialPost 필요)
 */
export function PostEditor({ mode, initialPost }: PostEditorProps) {
  const router = useRouter();

  const isEdit = mode === "edit";

  const [handle, setHandle] = useState(initialPost?.handle ?? "");
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 필드별 에러 상태
  const [fieldErrors, setFieldErrors] = useState<{
    handle?: string;
    title?: string;
    content?: string;
  }>({});

  const [showPreview, setShowPreview] = useState(true);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formHeight, setFormHeight] = useState<number | null>(null);

  // 폼 높이를 기준으로 오른쪽 미리보기 영역 높이 맞추기
  useEffect(() => {
    if (!formRef.current || typeof ResizeObserver === "undefined") return;

    const el = formRef.current;

    setFormHeight(el.offsetHeight);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const h = entry.contentRect.height;
      setFormHeight(h);
    });

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const trimmedHandle = handle.trim();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    const newFieldErrors: {
      handle?: string;
      title?: string;
      content?: string;
    } = {};

    // Handle 검증은 "새 글 작성"에서만 수행 (수정에서는 보통 핸들 변경 안한다고 가정)
    if (!isEdit) {
      if (!trimmedHandle) {
        newFieldErrors.handle = "Handle is required.";
      } else if (!/^[a-zA-Z0-9_-]+$/.test(trimmedHandle)) {
        newFieldErrors.handle =
          "Handle can only contain letters, numbers, '_' and '-' (no spaces).";
      } else if (trimmedHandle.length < 3 || trimmedHandle.length > 24) {
        newFieldErrors.handle = "Handle must be 3–24 characters long.";
      }
    }

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
      let res: Response;
      if (isEdit) {
        if (!initialPost?.id) {
          setError("Missing post id.");
          return;
        }

        // NOTE: 업데이트 메서드를 PUT이라고 가정
        // 만약 /api/posts/[id]가 PATCH라면 method만 PATCH로 바꾸면 됨
        res = await fetch(`/api/posts/${initialPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: trimmedTitle,
            content: trimmedContent,
            // handle 수정도 허용하고 싶다면 아래 주석 해제
            // handle: trimmedHandle,
          }),
        });
      } else {
        // 새 글 작성
        res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handle: trimmedHandle,
            title: trimmedTitle,
            content: trimmedContent,
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.error?.message || "Failed to save the post.";
        setError(message);
        return;
      }

      const data = await res.json().catch(() => ({}));

      // 생성일 때는 서버가 내려주는 id 사용, 수정일 때는 이미 id를 알고 있음
      const id =
        !isEdit
          ? data.id
          : initialPost?.id;

      if (typeof id === "number" || typeof id === "string") {
        router.push(`/posts/${id}`);
      } else {
        setError("Invalid response from server.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  const heading = isEdit ? "Edit post" : "Write a new post";
  const description = isEdit
    ? "Update your post."
    : "Share your thoughts with the community.";
  const submitLabel = submitting
    ? isEdit
      ? "Saving..."
      : "Publishing..."
    : isEdit
    ? "Save changes"
    : "Publish";

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[1000px]">
        <Card className="w-full shadow-sm border border-border/80">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-semibold">
                  {heading}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Preview</span>
                <Switch
                  checked={showPreview}
                  onCheckedChange={setShowPreview}
                  disabled={submitting}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 pb-6">
            <div
              className={
                showPreview
                  ? "flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-8"
                  : "flex flex-col"
              }
            >
              {/* 폼 영역 */}
              <form ref={formRef} onSubmit={onSubmit} className="w-full">
                <div className="space-y-6 w-full">
                  {/* 상단 공통 에러(Alert) */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Handle */}
                  <div className="space-y-2">
                    <Label htmlFor="handle" className="text-sm font-semibold">
                      Handle
                    </Label>
                    <Input
                      id="handle"
                      placeholder="e.g. backend_lover"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      disabled={submitting || isEdit} // 수정 모드에서는 핸들 변경 막기 (원하면 이 부분 풀어도 됨)
                      className={`w-full ${
                        fieldErrors.handle
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      aria-invalid={!!fieldErrors.handle}
                      aria-describedby={
                        fieldErrors.handle ? "handle-error" : undefined
                      }
                    />
                    <p className="text-xs leading-snug text-muted-foreground mt-1">
                      3–24 characters, letters, numbers, “_” and “-” only. No
                      spaces.
                    </p>
                    {fieldErrors.handle && (
                      <p
                        id="handle-error"
                        className="text-xs text-destructive mt-1"
                      >
                        {fieldErrors.handle}
                      </p>
                    )}
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
                      placeholder="What would you like to talk about?"
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
                      {submitLabel}
                    </Button>
                  </div>
                </div>
              </form>

              {/* 미리보기 패널 */}
              {showPreview && (
                <div
                  className="border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-6 md:overflow-hidden"
                  style={formHeight ? { height: formHeight } : undefined}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Preview
                    </span>
                  </div>

                  <ScrollArea className="h-full pr-3">
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
                        {content.trim() || "_Nothing to preview yet._"}
                      </ReactMarkdown>
                    </article>
                  </ScrollArea>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
