"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  AuthCard,
  FormError,
  FormField,
  SubmitButton,
  TextInput,
} from "@/components/auth/AuthCard";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const initial: ForgotPasswordState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initial);

  if (state.submitted) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle="If an account exists with that email, we just sent a reset link."
      >
        <p className="text-sm text-muted-foreground">
          The link is valid for 1 hour. Don&apos;t see the email? Check spam, then{" "}
          <Link href="/forgot-password" className="text-primary hover:underline">
            try again
          </Link>
          .
        </p>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Back to log in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we&apos;ll send you a reset link."
    >
      <form action={formAction} className="space-y-5">
        <FormError message={state.error} />
        <FormField label="Email" htmlFor="email">
          <TextInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </FormField>
        <SubmitButton pending={pending}>Send reset link</SubmitButton>
        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Back to log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
