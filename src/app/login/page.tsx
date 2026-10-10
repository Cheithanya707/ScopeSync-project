import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue to your ScopeSync workspace.">
      <LoginForm />
    </AuthLayout>
  );
}
