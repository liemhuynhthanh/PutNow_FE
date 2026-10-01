import { RequireRole } from "@/features/auth/require-role";
export default function BookingsLayout({ children }: { children: React.ReactNode }) { return <RequireRole>{children}</RequireRole>; }
