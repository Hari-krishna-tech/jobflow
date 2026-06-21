import { signIn } from "@/lib/auth";
import Image from "next/image";

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-bg px-6 py-24">
      <div className="flex w-full max-w-[400px] flex-col gap-6 rounded-lg p-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/logo.svg"
            alt="JobFlow Logo"
            width={40}
            height={40}
            className="size-10"
          />
          <div className="flex flex-col gap-1">
            <h1 className="text-h1 font-bold tracking-tight text-text">
              JobFlow
            </h1>
            <p className="text-sm text-text-dim">
              Sign in to track your applications.
            </p>
          </div>
        </div>

        {/* Single primary action — CONTEXT §5: full-width Google button */}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}
