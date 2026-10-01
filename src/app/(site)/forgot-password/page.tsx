import { AuthShell } from "@/features/auth/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/forms";

export default function ForgotPasswordPage() { return <AuthShell title="Reset your password" description="We will email a secure reset link to your account address."><ForgotPasswordForm /></AuthShell>; }
