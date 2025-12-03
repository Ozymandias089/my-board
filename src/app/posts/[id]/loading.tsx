// app/posts/[id]/loading.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        {/* 뒤로가기 자리도 살짝 고정 */}
        <div className="inline-flex items-center text-sm text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Back to posts</span>
        </div>

        <Card className="w-full border shadow-sm">
          <CardHeader className="space-y-3">
            {/* 제목 스켈레톤 */}
            <Skeleton className="h-7 w-3/4" />
            {/* handle + 날짜 스켈레톤 */}
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>

          <CardContent className="space-y-2 mt-2">
            {/* 본문 스켈레톤: 여러 줄 */}
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
