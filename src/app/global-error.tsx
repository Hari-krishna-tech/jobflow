"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught error:", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Application Error — JobFlow</title>
      </head>
      <body className="bg-[#0a0a0b] text-[#ededf0] min-h-screen flex flex-col items-center justify-center p-6 text-center antialiased">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-bg text-[#ef4444] mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-[#ededf0] mb-2">
          A fatal error occurred
        </h1>
        
        <p className="max-w-md text-sm text-[#a1a1aa] mb-8 leading-relaxed">
          JobFlow encountered a critical error and could not load. Try reloading the application.
        </p>
        
        <button
          onClick={() => reset()}
          className="px-4 py-2 text-sm font-medium rounded-sm border border-[#26262c] bg-[#151518] hover:bg-[#1a1a1f] text-[#ededf0] transition-colors cursor-pointer"
        >
          Reload application
        </button>
      </body>
    </html>
  );
}
