"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary caught error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-bg text-red mb-6">
        <AlertTriangle className="h-8 w-8" />
      </div>
      
      <h1 className="text-2xl font-bold tracking-tight text-text mb-2">
        Something went wrong
      </h1>
      
      <p className="max-w-md text-sm text-text-dim mb-8 leading-relaxed">
        An error occurred while loading this page. If this problem persists, please check your network connection or try again.
      </p>
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-4 py-2 text-sm font-medium rounded-sm border border-border bg-card hover:bg-card-hover text-text transition-colors cursor-pointer"
        >
          Try again
        </button>
        
        <Link
          href="/"
          className="px-4 py-2 text-sm font-medium rounded-sm bg-accent text-white hover:bg-accent-soft transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
