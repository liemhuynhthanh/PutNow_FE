import { AuthShell } from "@/features/auth/auth-shell";
import { RegisterForm } from "@/features/auth/forms";

export default function RegisterPage() { return <AuthShell title="Create your account" description="Start discovering and reserving concert tickets."><RegisterForm /></AuthShell>; }
