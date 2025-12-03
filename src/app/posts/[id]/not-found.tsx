// app/posts/[id]/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftCircle } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <ArrowLeftCircle className="w-10 h-10 mx-auto text-muted-foreground" />
        <h1 className="text-xl font-semibold">Post not found</h1>
        <p className="text-sm text-muted-foreground">
          The post you are looking for does not exist or has been removed.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/">Back to posts</Link>
        </Button>
      </div>
    </main>
  );
}
