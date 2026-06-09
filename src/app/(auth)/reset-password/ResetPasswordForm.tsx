"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  FormError,
  FormField,
  SubmitButton,
  TextInput,
} from "@/components/auth/AuthCard";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initial: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initial);

  if (state.success) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          ✓ Your password has been updated.
        </div>
        <p className="text-sm text-muted-foreground">
          You can now{" "}
          <Link href="/login" className="text-primary hover:underline">
            log in with your new password
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />
      <input type="hidden" name="token" value={token} />
      <FormField label="New password" htmlFor="password" hint="At least 10 characters.">
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
      </FormField>
      <SubmitButton pending={pending}>Update password</SubmitButton>
    </form>
  );
}
