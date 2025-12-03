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

// ★ 추가: shadcn Alert + 아이콘
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
      <div className="w-full max-w-[900px]">
        <Card className="w-full shadow-sm border border-border/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold">
              Write a new post
            </CardTitle>
            <CardDescription>
              Share your thoughts with the community.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 pb-6">
            <form onSubmit={onSubmit} className="w-full">
              {/* 실제 폼 콘텐츠 폭: 모바일에서는 100%, sm 이상에서만 고정 */}
              <div className="space-y-6 w-full">
                {/* ★ 추가: 상단 공통 에러(Alert) */}
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
                    // ★ 수정: 에러 시 빨간 테두리 + 접근성 속성
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
                  {/* ★ 추가: 핸들 에러 메시지 */}
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
                    // ★ 수정: 타이틀 에러 시 스타일
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
                  {/* ★ 추가: 타이틀 에러 메시지 */}
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
                    }`} // ★ 수정: 내용 에러 시 스타일
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

                  {/* ★ 추가: 내용 에러 메시지 */}
                  {fieldErrors.content && (
                    <p
                      id="content-error"
                      className="text-xs text-destructive mt-1"
                    >
                      {fieldErrors.content}
                    </p>
                  )}
                </div>

                {/* 기존 에러 <p> 블록은 Alert로 대체됨 */}

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
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
