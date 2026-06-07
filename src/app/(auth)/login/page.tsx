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
import { GoogleSignInButton, OrDivider } from "@/components/auth/GoogleSignInButton";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <AuthCard title="Welcome back" subtitle="Log in to your RealGoal account.">
      <div className="space-y-4">
        <GoogleSignInButton label="Continue with Google" />
        <OrDivider />
      </div>
      <form action={formAction} className="mt-4 space-y-5">
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
        <FormField label="Password" htmlFor="password">
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={1}
          />
        </FormField>
        <SubmitButton pending={pending}>Log in</SubmitButton>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
