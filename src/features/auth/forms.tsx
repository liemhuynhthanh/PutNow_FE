"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FormErrorSummary, Label, PasswordInput } from "@/components/form-field";
import { errorMessage } from "@/lib/api-client";
import { authApi } from "./api";
import { sessionKey, useSession } from "./use-session";

const loginSchema = z.object({
  name: z.string().min(2, "Enter your username."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});
const registerSchema = z.object({
  name: z.string().min(2, "Use at least 2 characters.").max(100),
  email: z.email("Enter a valid email address."),
  phone: z.string().max(20).optional(),
  password: z.string().min(6, "Use at least 6 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});
const resetSchema = z.object({
  password: z.string().min(6, "Use at least 6 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

function errorMessages(errors: FieldErrors, mutationError?: unknown) {
  const messages = Object.values(errors).flatMap((error) => error?.message ? [String(error.message)] : []);
  if (mutationError) messages.push(errorMessage(mutationError));
  return [...new Set(messages)];
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();
  const form = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { name: "", password: "" } });
  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      queryClient.setQueryData(sessionKey, user);
      toast.success(`Welcome back, ${user.name}.`);
      router.replace(next?.startsWith("/") ? next : user.role === "ADMIN" ? "/admin" : "/concerts");
    },
  });
  useEffect(() => {
    if (session.data) router.replace(next?.startsWith("/") ? next : session.data.role === "ADMIN" ? "/admin" : "/concerts");
  }, [next, router, session.data]);
  const errors = errorMessages(form.formState.errors, mutation.error);

  return (
    <form className="space-y-5" noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <FormErrorSummary messages={errors} />
      <Field><Label htmlFor="name">Username</Label><Input id="name" autoComplete="username" aria-invalid={Boolean(form.formState.errors.name)} aria-describedby={form.formState.errors.name ? "name-error" : undefined} {...form.register("name")} /><FieldError id="name-error" message={form.formState.errors.name?.message} /></Field>
      <Field><div className="flex justify-between gap-4"><Label htmlFor="password">Password</Label><Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline">Forgot password?</Link></div><PasswordInput id="password" autoComplete="current-password" aria-invalid={Boolean(form.formState.errors.password)} aria-describedby={form.formState.errors.password ? "password-error" : undefined} {...form.register("password")} /><FieldError id="password-error" message={form.formState.errors.password?.message} /></Field>
      <Button className="w-full" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Signing in…" : "Sign in"}</Button>
      <p className="text-center text-sm text-muted-foreground">No account yet? <Link href="/register" className="font-semibold text-primary hover:underline">Create one</Link></p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema), defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" } });
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof registerSchema>) => authApi.register({ name: values.name, email: values.email, phone: values.phone, password: values.password }),
    onSuccess: () => { toast.success("Account created. You can sign in now."); router.push("/login"); },
  });
  const errors = errorMessages(form.formState.errors, mutation.error);
  return (
    <form className="space-y-4" noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <FormErrorSummary messages={errors} />
      <Field><Label htmlFor="name">Username</Label><Input id="name" autoComplete="username" aria-invalid={Boolean(form.formState.errors.name)} aria-describedby={form.formState.errors.name ? "name-error" : undefined} {...form.register("name")} /><FieldError id="name-error" message={form.formState.errors.name?.message} /></Field>
      <Field><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(form.formState.errors.email)} aria-describedby={form.formState.errors.email ? "email-error" : undefined} {...form.register("email")} /><FieldError id="email-error" message={form.formState.errors.email?.message} /></Field>
      <Field><Label htmlFor="phone">Phone <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(form.formState.errors.phone)} aria-describedby={form.formState.errors.phone ? "phone-error" : undefined} {...form.register("phone")} /><FieldError id="phone-error" message={form.formState.errors.phone?.message} /></Field>
      <Field><Label htmlFor="password">Password</Label><PasswordInput id="password" autoComplete="new-password" aria-invalid={Boolean(form.formState.errors.password)} aria-describedby={form.formState.errors.password ? "password-error" : undefined} {...form.register("password")} /><FieldError id="password-error" message={form.formState.errors.password?.message} /></Field>
      <Field><Label htmlFor="confirmPassword">Confirm password</Label><PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={Boolean(form.formState.errors.confirmPassword)} aria-describedby={form.formState.errors.confirmPassword ? "confirm-password-error" : undefined} {...form.register("confirmPassword")} /><FieldError id="confirm-password-error" message={form.formState.errors.confirmPassword?.message} /></Field>
      <Button className="w-full" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creating account…" : "Create account"}</Button>
      <p className="text-center text-sm text-muted-foreground">Already registered? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link></p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const form = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.email("Enter a valid email address.") })), defaultValues: { email: "" } });
  const mutation = useMutation({ mutationFn: authApi.forgotPassword });
  if (mutation.isSuccess) return <Alert><AlertDescription>If an account matches that email, a password reset link has been sent. Check your inbox.</AlertDescription></Alert>;
  const errors = errorMessages(form.formState.errors, mutation.error);
  return <form className="space-y-5" noValidate onSubmit={form.handleSubmit(({ email }) => mutation.mutate(email))}><FormErrorSummary messages={errors} /><Field><Label htmlFor="email">Account email</Label><Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(form.formState.errors.email)} aria-describedby={form.formState.errors.email ? "email-error" : undefined} {...form.register("email")} /><FieldError id="email-error" message={form.formState.errors.email?.message} /></Field><Button className="w-full" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Sending…" : "Send reset link"}</Button><Button className="w-full" variant="ghost" asChild><Link href="/login">Back to sign in</Link></Button></form>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema), defaultValues: { password: "", confirmPassword: "" } });
  const validate = useMutation({ mutationFn: () => authApi.validateResetToken(token) });
  const reset = useMutation({ mutationFn: ({ password, confirmPassword }: z.infer<typeof resetSchema>) => authApi.resetPassword(token, password, confirmPassword), onSuccess: () => { toast.success("Password changed. Sign in with your new password."); router.push("/login"); } });
  useEffect(() => { if (token) validate.mutate(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!token) return <Alert variant="destructive"><AlertDescription>This reset link is missing its token.</AlertDescription></Alert>;
  if (validate.isPending || validate.isIdle) return <p className="text-sm text-muted-foreground">Checking your reset link…</p>;
  if (validate.isError) return <Alert variant="destructive"><AlertDescription>{errorMessage(validate.error)}</AlertDescription></Alert>;
  const errors = errorMessages(form.formState.errors, reset.error);
  return <form className="space-y-5" noValidate onSubmit={form.handleSubmit((values) => reset.mutate(values))}><FormErrorSummary messages={errors} /><Field><Label htmlFor="password">New password</Label><PasswordInput id="password" autoComplete="new-password" aria-invalid={Boolean(form.formState.errors.password)} aria-describedby={form.formState.errors.password ? "password-error" : undefined} {...form.register("password")} /><FieldError id="password-error" message={form.formState.errors.password?.message} /></Field><Field><Label htmlFor="confirmPassword">Confirm new password</Label><PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={Boolean(form.formState.errors.confirmPassword)} aria-describedby={form.formState.errors.confirmPassword ? "confirm-password-error" : undefined} {...form.register("confirmPassword")} /><FieldError id="confirm-password-error" message={form.formState.errors.confirmPassword?.message} /></Field><Button className="w-full" type="submit" disabled={reset.isPending}>{reset.isPending ? "Updating…" : "Set new password"}</Button></form>;
}
