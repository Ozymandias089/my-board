// app/posts/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PostsError({ error, reset }: ErrorProps) {
  // 콘솔에 남겨두면 디버깅에 도움됨
  useEffect(() => {
    console.error("Posts error boundary:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full border rounded-lg p-6 shadow-sm bg-background space-y-4 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred while loading posts.
        </p>

        {/* 개발 중에는 에러 메시지 잠깐 노출해봐도 좋음 */}
        {/* <p className="text-xs text-muted-foreground break-all">
          {error.message}
        </p> */}

        <div className="flex gap-2 justify-center pt-2">
          <Button variant="outline" onClick={() => reset()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Try again
          </Button>
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
