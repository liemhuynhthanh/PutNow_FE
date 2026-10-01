import { AuthShell } from "@/features/auth/auth-shell";
import { LoginForm } from "@/features/auth/forms";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  return <AuthShell title="Welcome back" description="Sign in once and we will send you to the right place."><LoginForm next={typeof params.next === "string" ? params.next : undefined} /></AuthShell>;
}
