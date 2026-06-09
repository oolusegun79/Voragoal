import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard
        title="Reset link missing"
        subtitle="This page must be opened from the link in your reset email."
      >
        <p className="text-sm text-muted-foreground">
          Need a new link?{" "}
          <Link href="/forgot-password" className="text-primary hover:underline">
            Request one
          </Link>
          .
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Pick something you don&apos;t use anywhere else."
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
