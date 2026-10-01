import { AuthShell } from "@/features/auth/auth-shell";
import { ResetPasswordForm } from "@/features/auth/forms";

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) { const params = await searchParams; return <AuthShell title="Choose a new password" description="This link is checked before your password is updated."><ResetPasswordForm token={typeof params.token === "string" ? params.token : ""} /></AuthShell>; }
