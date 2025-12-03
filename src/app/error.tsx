// app/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full border rounded-lg p-6 shadow-sm bg-background space-y-4 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-lg font-semibold">Unexpected error</h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong. Please try again in a moment.
        </p>

        <div className="flex gap-2 justify-center pt-2">
          <Button variant="outline" onClick={() => reset()}>
            Retry
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-1" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
