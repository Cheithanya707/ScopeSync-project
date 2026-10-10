"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFriendlyAuthError, isValidEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { InlineLoader } from "@/src/ui/InlineLoader";

export function LoginForm() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, loading, authActionPending, getFriendlyAuthError: friendlyError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMethod, setActiveMethod] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState("");
  const busy = isSubmitting || loading || authActionPending;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setError("");
    setActiveMethod("email");
    setIsSubmitting(true);

    try {
      await signInWithEmail(email, password);
      router.push("/dashboard");
    } catch (submitError) {
      setError(friendlyError(submitError));
    } finally {
      setIsSubmitting(false);
      setActiveMethod(null);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setActiveMethod("google");
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (submitError) {
      setError(getFriendlyAuthError(submitError));
    } finally {
      setIsSubmitting(false);
      setActiveMethod(null);
    }
  };

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            autoComplete="email"
            placeholder="name@example.com"
            disabled={busy}
            aria-invalid={Boolean(error && !isValidEmail(email))}
            aria-describedby={error && !isValidEmail(email) ? "login-error" : undefined}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="login-password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Link href="/forgot-password" className="rounded-sm text-xs font-medium text-brand hover:text-brand-dark">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={busy}
              className="pr-10"
              aria-invalid={Boolean(error && !password)}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {error ? (
          <p id="login-error" role="alert" aria-live="polite" className="rounded-lg border border-brand/25 bg-brand/10 px-3 py-2 text-sm text-foreground">{error}</p>
        ) : null}

        <Button type="submit" className="h-11 w-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" disabled={busy}>
          {isSubmitting && activeMethod === "email"
            ? <><InlineLoader label="Signing in" size={18} />Signing in...</>
            : "Log In"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">or</span>
        </div>
      </div>

      <GoogleButton
        label={isSubmitting && activeMethod === "google" ? "Connecting to Google..." : "Continue with Google"}
        onClick={handleGoogleLogin}
        disabled={busy}
      />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="rounded-sm font-semibold text-brand hover:text-brand-dark">
          Create account
        </Link>
      </p>
    </>
  );
}
