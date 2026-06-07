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
import { signupAction, type SignupState } from "./actions";

const initial: SignupState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, initial);

  return (
    <AuthCard
      title="Create your account"
      subtitle="Free forever. No credit card required."
    >
      <form action={formAction} className="space-y-5">
        <FormError message={state.error} />
        <FormField label="Name" htmlFor="name">
          <TextInput
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Olu Olusegun"
          />
        </FormField>
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
        <FormField
          label="Password"
          htmlFor="password"
          hint="At least 10 characters."
        >
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
          />
        </FormField>
        <SubmitButton pending={pending}>Create account</SubmitButton>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
