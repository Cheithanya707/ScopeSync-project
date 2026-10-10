"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFriendlyAuthError, getUserDestination, isValidEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { InlineLoader } from "@/src/ui/InlineLoader";

export function SignupForm() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, loading, authActionPending, getFriendlyAuthError: friendlyError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMethod, setActiveMethod] = useState<"email" | "google" | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [confirmTouched, setConfirmTouched] = useState(false);
  const busy = isSubmitting || loading || authActionPending;
  const requirements = [
    { label: "8 characters", valid: password.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /\d/.test(password) },
    { label: "Special character", valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const strength = requirements.filter((item) => item.valid).length;
  const strengthLabel = ["No strength yet", "Weak", "Fair", "Good", "Strong", "Strong"][strength];
  const passwordRequirementsMet = requirements.every((item) => item.valid);
  const confirmMismatch = Boolean(confirmPassword && confirmPassword !== password);
  const clearFieldError = (field: string) => {
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  const validate = () => {
    const nextErrors: { [key: string]: string } = {};

    if (name.trim().length < 2) {
      nextErrors.name = "Enter your full name.";
    }

    if (!isValidEmail(email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!passwordRequirementsMet) {
      nextErrors.password = "Meet all password requirements before creating your account.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (confirmMismatch) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setActiveMethod("email");
    setIsSubmitting(true);

    try {
      await signUpWithEmail({ name, email, password });
      router.push("/onboarding");
    } catch (submitError) {
      setErrors((prev) => ({
        ...prev,
        form: friendlyError(submitError),
      }));
    } finally {
      setIsSubmitting(false);
      setActiveMethod(null);
    }
  };

  const handleGoogleSignup = async () => {
    setErrors({});
    setActiveMethod("google");
    setIsSubmitting(true);

    try {
      const googleUser = await signInWithGoogle();
      router.push(getUserDestination(googleUser));
    } catch (submitError) {
      setErrors({ form: getFriendlyAuthError(submitError) });
    } finally {
      setIsSubmitting(false);
      setActiveMethod(null);
    }
  };

  return (
    <>
      <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="signup-name" className="text-sm font-medium text-foreground">
            Full Name
          </label>
          <Input
            id="signup-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearFieldError("name");
            }}
            autoComplete="name"
            placeholder="Alex Morgan"
            disabled={busy}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "signup-name-error" : undefined}
          />
          {errors.name ? <p id="signup-name-error" className="text-xs text-brand-dark dark:text-brand">{errors.name}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearFieldError("email");
            }}
            autoComplete="email"
            placeholder="name@example.com"
            disabled={busy}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
          />
          {errors.email ? <p id="signup-email-error" className="text-xs text-brand-dark dark:text-brand">{errors.email}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                clearFieldError("password");
              }}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              disabled={busy}
              className="pr-10"
              aria-invalid={Boolean(errors.password)}
              aria-describedby="signup-password-guidance"
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
          <div id="signup-password-guidance" className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Password strength</span>
              <span className="font-medium text-foreground" aria-live="polite">{strengthLabel}</span>
            </div>
            <div
              className="flex gap-1"
              role="progressbar"
              aria-label="Password strength"
              aria-valuemin={0}
              aria-valuemax={5}
              aria-valuenow={strength}
              aria-valuetext={strengthLabel}
            >
              {requirements.map((item, index) => (
                <span
                  key={item.label}
                  aria-hidden="true"
                  className={`h-1 flex-1 rounded-full transition-colors ${index < strength ? "bg-brand" : "bg-muted"}`}
                />
              ))}
            </div>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted-foreground sm:grid-cols-3">
              {requirements.map((item) => (
                <li key={item.label} className={`flex items-center gap-1 ${item.valid ? "text-foreground" : ""}`}>
                  {item.valid ? <Check aria-hidden="true" className="size-3 text-brand" /> : <X aria-hidden="true" className="size-3 opacity-50" />}
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
          {errors.password ? <p className="text-xs text-brand-dark dark:text-brand">{errors.password}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-confirm-password" className="text-sm font-medium text-foreground">
            Confirm Password
          </label>
          <div className="relative">
            <Input
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                clearFieldError("confirmPassword");
              }}
              autoComplete="new-password"
              placeholder="Repeat your password"
              disabled={busy}
              className="pr-10"
              aria-invalid={Boolean(errors.confirmPassword || (confirmTouched && confirmMismatch))}
              aria-describedby={errors.confirmPassword || (confirmTouched && confirmMismatch) ? "signup-confirm-error" : undefined}
              onBlur={() => setConfirmTouched(true)}
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
            >
              {showConfirmPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
          </div>
          {errors.confirmPassword || (confirmTouched && confirmMismatch) ? (
            <p id="signup-confirm-error" className="text-xs text-brand-dark dark:text-brand">
              {errors.confirmPassword || "Passwords do not match."}
            </p>
          ) : null}
        </div>

        {errors.form ? (
          <p role="alert" aria-live="polite" className="rounded-lg border border-brand/25 bg-brand/10 px-3 py-2 text-sm text-foreground">{errors.form}</p>
        ) : null}

        <Button type="submit" className="h-11 w-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" disabled={busy}>
          {isSubmitting && activeMethod === "email"
            ? <><InlineLoader label="Creating account" size={18} />Creating account...</>
            : "Create Account"}
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
        onClick={handleGoogleSignup}
        disabled={busy}
      />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="rounded-sm font-semibold text-brand hover:text-brand-dark">
          Log in
        </Link>
      </p>
    </>
  );
}
