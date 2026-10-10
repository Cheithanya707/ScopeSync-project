import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthLayout title="Create your ScopeSync account" subtitle="Start with a clearer view of your projects.">
      <SignupForm />
    </AuthLayout>
  );
}
