import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function PostCardSkeleton() {
    return (
        <Card className="w-full border shadow-sm">
            <CardHeader className="space-y-2">
                {/* 제목 스켈레톤 */}
                <Skeleton className="h-5 w-3/4"/>
                {/* 메타 정보 스켈레톤 */}
                <Skeleton className="h-4 w-1/3"/>
            </CardHeader>
            <CardContent>
                {/* 내용 스켈레톤 */}
                <Skeleton className="h-3 w-full"/>
                <Skeleton className="h-3 w-5/6"/>
                <Skeleton className="h-3 w-2/3"/>
            </CardContent>
        </Card>
    );
}