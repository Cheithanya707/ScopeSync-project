"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";
import { Input } from "@/components/ui/input";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { PROJECT_USE_CASES, type ProjectUseCaseValue } from "@/lib/constants";
import { completeOnboarding } from "@/services/onboarding/onboardingService";
import { updateCurrentUserWorkspace } from "@/lib/auth";

const STORAGE_KEY = "scopesync-onboarding-use-case";

function OnboardingContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { refresh } = useWorkspace();
  const [selectedUseCase, setSelectedUseCase] = useState<ProjectUseCaseValue | "">(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const savedUseCase = window.localStorage.getItem(STORAGE_KEY) as ProjectUseCaseValue | null;
    return savedUseCase && PROJECT_USE_CASES.includes(savedUseCase) ? savedUseCase : "";
  });
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [occupation, setOccupation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const workspaceOwnerName = user?.displayName?.trim() || user?.email?.split("@")[0];
  const workspaceName = workspaceOwnerName ? `${workspaceOwnerName}'s Workspace` : "My Workspace";

  const handleContinue = async () => {
    const numericAge = Number(age);
    if (
      !selectedUseCase ||
      !Number.isInteger(numericAge) ||
      numericAge < 1 ||
      numericAge > 120 ||
      !country.trim() ||
      !city.trim() ||
      !occupation.trim() ||
      !user
    ) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const displayName = user.displayName?.trim() || user.email?.split("@")[0] || "ScopeSync user";
      const result = await completeOnboarding({
        uid: user.uid,
        email: user.email ?? "",
        displayName,
        photoURL: user.photoURL ?? undefined,
        age: numericAge,
        country,
        city,
        occupation,
        workTypes: [selectedUseCase],
        goals: [],
        workspaceName,
        workspaceType: selectedUseCase,
      });
      updateCurrentUserWorkspace(result.workspaceId);
      window.localStorage.setItem(STORAGE_KEY, selectedUseCase);
      window.localStorage.setItem("scopesync-onboarding-complete", "true");
      await refresh();
      router.push("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Workspace setup failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen py-6 sm:py-10">
      <Container className="max-w-3xl">
        <Logo />
        <section className="mt-12 rounded-2xl border border-border bg-white p-6 shadow-sm sm:mt-16 sm:p-10">
          <p className="text-sm font-medium text-brand">Let&apos;s get you started</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Set up your workspace</h1>
          <p className="mt-3 text-muted-foreground">What do you use ScopeSync for?</p>
          <fieldset className="mt-7">
            <legend className="sr-only">Choose what you use ScopeSync for</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROJECT_USE_CASES.map((useCase) => (
                <label
                  key={useCase}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 text-sm font-medium text-slate-700 transition-colors ${
                    selectedUseCase === useCase
                      ? "border-brand bg-blue-50 text-brand"
                      : "border-border hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  <input
                    checked={selectedUseCase === useCase}
                    className="size-4 accent-brand"
                    name="use-case"
                    type="radio"
                    value={useCase}
                    onChange={() => setSelectedUseCase(useCase)}
                  />
                  {useCase}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="onboarding-age" className="text-sm font-medium text-slate-800">Age</label>
              <Input
                id="onboarding-age"
                type="number"
                min={1}
                max={120}
                step={1}
                value={age}
                onChange={(event) => setAge(event.target.value)}
                autoComplete="off"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="onboarding-country" className="text-sm font-medium text-slate-800">Country</label>
              <Input
                id="onboarding-country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                autoComplete="country-name"
                maxLength={100}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="onboarding-city" className="text-sm font-medium text-slate-800">City</label>
              <Input
                id="onboarding-city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                autoComplete="address-level2"
                maxLength={100}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="onboarding-occupation" className="text-sm font-medium text-slate-800">Occupation</label>
              <Input
                id="onboarding-occupation"
                value={occupation}
                onChange={(event) => setOccupation(event.target.value)}
                autoComplete="organization-title"
                maxLength={120}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          {error ? <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <Button
            className="mt-7 w-full sm:w-auto"
            type="button"
            onClick={handleContinue}
            disabled={
              !selectedUseCase ||
              !Number.isInteger(Number(age)) ||
              Number(age) < 1 ||
              Number(age) > 120 ||
              !country.trim() ||
              !city.trim() ||
              !occupation.trim() ||
              !user ||
              isSubmitting
            }
          >
            {isSubmitting ? "Creating workspace..." : "Continue"}
          </Button>
        </section>
      </Container>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingContent />
    </AuthGuard>
  );
}
