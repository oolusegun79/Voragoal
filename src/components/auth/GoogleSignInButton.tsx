"use client";

import { signInWithGoogle } from "@/server/auth/google-action";

export function GoogleSignInButton({
  label = "Continue with Google",
  redirectTo = "/dashboard",
}: {
  label?: string;
  redirectTo?: string;
}) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button
        type="submit"
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border/80 bg-card/40 px-4 text-sm font-medium text-foreground transition hover:bg-card-muted"
      >
        <GoogleIcon />
        {label}
      </button>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.1h11.3c-1.5 4.1-5.5 7.1-10.3 7.1-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1.1 7.3 2.8l5-5C29.2 7.1 26.7 6 24 6 14.1 6 6 14.1 6 24s8.1 18 18 18c10 0 17.4-7.2 17.4-18 0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M8.3 14.7l5.8 4.3C15.7 15.4 19.5 13 24 13c2.8 0 5.3 1.1 7.3 2.8l5-5C29.2 7.1 26.7 6 24 6 16.7 6 10.4 10.1 8.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 42c4.5 0 8.6-1.7 11.6-4.5l-5.4-4.6c-2 1.4-4.4 2.1-7.2 2.1-4.7 0-8.7-3-10.2-7l-5.7 4.4C9.4 37.8 16 42 24 42z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.1h11.3c-.7 2-2 3.8-3.7 5l5.4 4.6C40.7 35 43.6 30 43.6 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border/60" />
      <span>or</span>
      <span className="h-px flex-1 bg-border/60" />
    </div>
  );
}
