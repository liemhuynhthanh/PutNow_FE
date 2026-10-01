"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Field, FieldError, FormErrorSummary, Label, PasswordInput } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usersApi } from "@/features/admin/api";
import { errorMessage } from "@/lib/api-client";

const schema = z.object({ name: z.string().trim().min(2, "Use at least 2 characters."), email: z.email("Enter a valid email address."), phone: z.string().max(20, "Phone must be at most 20 characters.").optional(), password: z.string().min(6, "Use at least 6 characters.") });
type UserForm = z.infer<typeof schema>;

export default function NewUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<UserForm>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", phone: "", password: "" } });
  const mutation = useMutation({ mutationFn: usersApi.create, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["users"] }); toast.success("User created."); router.push("/admin/users"); } });
  const errors = [...new Set([...Object.values(form.formState.errors).flatMap((error) => error?.message ? [String(error.message)] : []), ...(mutation.error ? [errorMessage(mutation.error)] : [])])];

  return (
    <div className="mx-auto max-w-2xl"><h1 className="text-3xl font-bold">Create user</h1><p className="mt-2 text-muted-foreground">New accounts are created with the customer role.</p><Card className="mt-8"><CardHeader><CardTitle>Account details</CardTitle></CardHeader><CardContent><form className="space-y-5" noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <FormErrorSummary messages={errors} />
      <Field><Label htmlFor="name">Username</Label><Input id="name" autoComplete="username" aria-invalid={Boolean(form.formState.errors.name)} aria-describedby={form.formState.errors.name ? "name-error" : undefined} {...form.register("name")} /><FieldError id="name-error" message={form.formState.errors.name?.message} /></Field>
      <Field><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(form.formState.errors.email)} aria-describedby={form.formState.errors.email ? "email-error" : undefined} {...form.register("email")} /><FieldError id="email-error" message={form.formState.errors.email?.message} /></Field>
      <Field><Label htmlFor="phone">Phone <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(form.formState.errors.phone)} aria-describedby={form.formState.errors.phone ? "phone-error" : undefined} {...form.register("phone")} /><FieldError id="phone-error" message={form.formState.errors.phone?.message} /></Field>
      <Field><Label htmlFor="password">Temporary password</Label><PasswordInput id="password" autoComplete="new-password" aria-invalid={Boolean(form.formState.errors.password)} aria-describedby={form.formState.errors.password ? "password-error" : undefined} {...form.register("password")} /><FieldError id="password-error" message={form.formState.errors.password?.message} /></Field>
      <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creating…" : "Create user"}</Button>
    </form></CardContent></Card></div>
  );
}
