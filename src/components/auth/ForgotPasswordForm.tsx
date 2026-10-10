"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getFriendlyAuthError, isValidEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineLoader } from "@/src/ui/InlineLoader";

export function ForgotPasswordForm() {
  const { sendPasswordReset, loading, authActionPending } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const busy = isSubmitting || loading || authActionPending;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      setMessage("");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await sendPasswordReset(email);
      setMessage("If an account exists for this email, a password reset link is on its way.");
    } catch (submitError) {
      const code = typeof submitError === "object" && submitError && "code" in submitError
        ? String((submitError as { code?: string }).code)
        : "";
      if (code === "auth/user-not-found") {
        setMessage("If an account exists for this email, a password reset link is on its way.");
      } else {
        setError(getFriendlyAuthError(submitError));
        setMessage("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <label htmlFor="reset-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="reset-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
            setMessage("");
          }}
          autoComplete="email"
          placeholder="name@example.com"
          disabled={busy}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "reset-error" : undefined}
        />
      </div>

      {error ? <p id="reset-error" role="alert" aria-live="polite" className="rounded-lg border border-brand/25 bg-brand/10 px-3 py-2 text-sm text-foreground">{error}</p> : null}
      {message ? <p role="status" aria-live="polite" className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">{message}</p> : null}

      <Button type="submit" className="h-11 w-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" disabled={busy}>
        {busy ? <><InlineLoader label="Sending reset email" size={18} />Sending reset email...</> : "Send Reset Link"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="rounded-sm font-medium text-brand hover:text-brand-dark">
          Back to login
        </Link>
      </div>
    </form>
  );
}
