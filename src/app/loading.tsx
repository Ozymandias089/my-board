import { PostCardSkeleton } from "@/components/post-card-skeleton";

export default function Loading() {
    return (
        <main className="min-h-screen bg-background text-foreground px-4 py-8 flex justify-center">
            <div className="w-full max-w-3xl space-y-4">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
            </div>
        </main>
    );
}