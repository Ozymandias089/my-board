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

export default function NewPostPage() {
  const router = useRouter();

  const [handle, setHandle] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ★ 추가: 필드별 에러 상태
  const [fieldErrors, setFieldErrors] = useState<{
    handle?: string;
    title?: string;
    content?: string;
  }>({});

  const [showPreview, setShowPreview] = useState(true);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formHeight, setFormHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!formRef.current || typeof ResizeObserver === "undefined") return;

    const el = formRef.current;

    // 초기 높이 세팅
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
    setFieldErrors({}); // ★ 추가: 이전 필드 에러 초기화

    const trimmedHandle = handle.trim(); // ★ 추가: 공통 트리밍
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    const newFieldErrors: {
      handle?: string;
      title?: string;
      content?: string;
    } = {};

    // ★ 수정: 핸들 검증 강화 (공백, 길이, 허용 문자)
    if (!trimmedHandle) {
      newFieldErrors.handle = "Handle is required.";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(trimmedHandle)) {
      newFieldErrors.handle =
        "Handle can only contain letters, numbers, '_' and '-' (no spaces).";
    } else if (trimmedHandle.length < 3 || trimmedHandle.length > 24) {
      newFieldErrors.handle = "Handle must be 3–24 characters long.";
    }

    // ★ 수정: 타이틀 검증 분리
    if (!trimmedTitle) {
      newFieldErrors.title = "Title is required.";
    }

    // ★ 수정: 내용 검증 분리
    if (!trimmedContent) {
      newFieldErrors.content = "Content is required.";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return; // ★ 수정: 클라이언트 검증 실패 시 서버 요청 안 보냄
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // ★ 수정: 서버로는 트리밍된 값 전달
          handle: trimmedHandle,
          title: trimmedTitle,
          content: trimmedContent,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.error?.message || "Failed to create post.";
        setError(message); // ★ 유지: 서버 에러는 상단 Alert로 표시
        return;
      }

      const data = await res.json();
      const id = data.id;

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

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8">
      {/* 화면 전체에서 가운데 정렬 + 최대 폭만 제한 */}
      <div className="w-full max-w-[1000px]">
        <Card className="w-full shadow-sm border border-border/80">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-semibold">
                  Write a new post
                </CardTitle>
                <CardDescription>
                  Share your thoughts with the community.
                </CardDescription>
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
            {/* ★ 작성 폼 + 미리보기 2열 레이아웃
                - 모바일: 위(폼) / 아래(미리보기)
                - md 이상: 좌(폼) / 우(미리보기) + 세퍼레이터 느낌의 보더 */}
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
                      disabled={submitting}
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
                      {submitting ? "Publishing..." : "Publish"}
                    </Button>
                  </div>
                </div>
              </form>

              {/* ★ 미리보기 패널 */}
              {showPreview && (
                <div 
                  className="border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-6 md:overflow-hidden"
                  style={
                    formHeight
                      ? { height: formHeight }
                      : undefined
                  }
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
