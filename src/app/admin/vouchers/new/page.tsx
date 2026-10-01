"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Field, FieldError, FormErrorSummary, Label } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { vouchersApi } from "@/features/admin/api";
import { errorMessage } from "@/lib/api-client";

const voucherSchema = z.object({
  code: z.string().trim().min(2, "Enter a voucher code."),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.number().min(0, "Discount cannot be negative."),
  maxUses: z.number().int().min(1, "Maximum uses must be at least 1."),
  expiredAt: z.string().min(1, "Choose an expiry time.").refine((value) => new Date(value).getTime() > Date.now(), "Expiry must be in the future."),
}).superRefine((data, context) => {
  if (data.discountType === "PERCENTAGE" && data.discountValue > 100) context.addIssue({ code: "custom", path: ["discountValue"], message: "Percentage cannot exceed 100." });
});

type VoucherForm = z.infer<typeof voucherSchema>;

export default function NewVoucherPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<VoucherForm>({ resolver: zodResolver(voucherSchema), defaultValues: { code: "", discountType: "PERCENTAGE", discountValue: 0, maxUses: 1, expiredAt: "" } });
  const mutation = useMutation({
    mutationFn: (values: VoucherForm) => vouchersApi.create({ ...values, code: values.code.trim().toUpperCase(), expiredAt: new Date(values.expiredAt).toISOString() }),
    onSuccess: async () => { form.reset(form.getValues()); await queryClient.invalidateQueries({ queryKey: ["vouchers"] }); toast.success("Voucher created."); router.push("/admin/vouchers"); },
  });

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (form.formState.isDirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [form.formState.isDirty]);

  const errors = [...new Set([...Object.values(form.formState.errors).flatMap((error) => error?.message ? [String(error.message)] : []), ...(mutation.error ? [errorMessage(mutation.error)] : [])])];
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Create voucher</h1><p className="mt-2 text-muted-foreground">Set the discount, usage cap, and expiry.</p>
      <Card className="mt-8"><CardHeader><CardTitle>Campaign details</CardTitle></CardHeader><CardContent><form className="space-y-5" noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <FormErrorSummary messages={errors} />
        <Field><Label htmlFor="code">Code</Label><Input id="code" className="uppercase" aria-invalid={Boolean(form.formState.errors.code)} aria-describedby={form.formState.errors.code ? "code-error" : undefined} {...form.register("code")} /><FieldError id="code-error" message={form.formState.errors.code?.message} /></Field>
        <Field><Label htmlFor="type">Discount type</Label><select id="type" className="h-11 w-full rounded-lg border bg-background px-3 text-sm" {...form.register("discountType")}><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed amount (VND)</option></select></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field><Label htmlFor="value">Discount value</Label><Input id="value" type="number" min="0" aria-invalid={Boolean(form.formState.errors.discountValue)} aria-describedby={form.formState.errors.discountValue ? "value-error" : undefined} {...form.register("discountValue", { valueAsNumber: true })} /><FieldError id="value-error" message={form.formState.errors.discountValue?.message} /></Field><Field><Label htmlFor="uses">Maximum uses</Label><Input id="uses" type="number" min="1" aria-invalid={Boolean(form.formState.errors.maxUses)} aria-describedby={form.formState.errors.maxUses ? "uses-error" : undefined} {...form.register("maxUses", { valueAsNumber: true })} /><FieldError id="uses-error" message={form.formState.errors.maxUses?.message} /></Field></div>
        <Field><Label htmlFor="expiry">Expires at</Label><Input id="expiry" type="datetime-local" aria-invalid={Boolean(form.formState.errors.expiredAt)} aria-describedby={form.formState.errors.expiredAt ? "expiry-error" : undefined} {...form.register("expiredAt")} /><FieldError id="expiry-error" message={form.formState.errors.expiredAt?.message} /></Field>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creating…" : "Create voucher"}</Button>
      </form></CardContent></Card>
    </div>
  );
}
