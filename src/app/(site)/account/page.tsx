"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Field, FieldError, FormErrorSummary, Label, PasswordInput } from "@/components/form-field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireRole } from "@/features/auth/require-role";
import { authApi } from "@/features/auth/api";
import { sessionKey, useSession } from "@/features/auth/use-session";
import { errorMessage } from "@/lib/api-client";
import { initials } from "@/lib/format";

const schema = z.object({ currentPassword: z.string().min(1, "Enter your current password."), newPassword: z.string().min(6, "Use at least 6 characters."), confirmPassword: z.string() }).refine((data) => data.newPassword === data.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });
type PasswordForm = z.infer<typeof schema>;

function AccountContent() {
  const { data: user } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<PasswordForm>({ resolver: zodResolver(schema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });
  const mutation = useMutation({
    mutationFn: (values: PasswordForm) => authApi.changePassword(values.currentPassword, values.newPassword, values.confirmPassword),
    onSuccess: () => { queryClient.setQueryData(sessionKey, null); toast.success("Password changed. Please sign in again."); router.replace("/login"); },
  });
  if (!user) return null;
  const errors = [...new Set([...Object.values(form.formState.errors).flatMap((error) => error?.message ? [String(error.message)] : []), ...(mutation.error ? [errorMessage(mutation.error)] : [])])];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold">Account</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Profile</CardTitle></CardHeader><CardContent><div className="flex items-center gap-4"><Avatar className="size-14"><AvatarFallback>{initials(user.name)}</AvatarFallback></Avatar><div><p className="text-lg font-semibold">{user.name}</p><p className="text-sm text-muted-foreground">{user.role}</p></div></div><dl className="mt-6 grid gap-4 text-sm"><div><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{user.email}</dd></div><div><dt className="text-muted-foreground">Phone</dt><dd className="font-medium">{user.phone || "Not provided"}</dd></div></dl></CardContent></Card>
        <Card><CardHeader><CardTitle>Change password</CardTitle><p className="text-sm text-muted-foreground">For security, changing it signs out every active session.</p></CardHeader><CardContent><form className="space-y-4" noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <FormErrorSummary messages={errors} />
          <Field><Label htmlFor="currentPassword">Current password</Label><PasswordInput id="currentPassword" autoComplete="current-password" aria-invalid={Boolean(form.formState.errors.currentPassword)} aria-describedby={form.formState.errors.currentPassword ? "current-password-error" : undefined} {...form.register("currentPassword")} /><FieldError id="current-password-error" message={form.formState.errors.currentPassword?.message} /></Field>
          <Field><Label htmlFor="newPassword">New password</Label><PasswordInput id="newPassword" autoComplete="new-password" aria-invalid={Boolean(form.formState.errors.newPassword)} aria-describedby={form.formState.errors.newPassword ? "new-password-error" : undefined} {...form.register("newPassword")} /><FieldError id="new-password-error" message={form.formState.errors.newPassword?.message} /></Field>
          <Field><Label htmlFor="confirmPassword">Confirm new password</Label><PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={Boolean(form.formState.errors.confirmPassword)} aria-describedby={form.formState.errors.confirmPassword ? "confirm-password-error" : undefined} {...form.register("confirmPassword")} /><FieldError id="confirm-password-error" message={form.formState.errors.confirmPassword?.message} /></Field>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Updating…" : "Change password"}</Button>
        </form></CardContent></Card>
      </div>
    </div>
  );
}

export default function AccountPage() { return <RequireRole><AccountContent /></RequireRole>; }
