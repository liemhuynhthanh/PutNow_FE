"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Field, FieldError, FormErrorSummary, Label } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mediaApi } from "@/features/admin/api";
import { concertsApi } from "@/features/concerts/api";
import { errorMessage } from "@/lib/api-client";

const ticketSchema = z.object({
  name: z.string().trim().min(1, "Enter a ticket name."),
  price: z.number().min(0, "Price cannot be negative."),
  totalQuantity: z.number().int().min(1, "Quantity must be at least 1."),
});

const concertSchema = z.object({
  title: z.string().trim().min(2, "Enter a concert title."),
  description: z.string(),
  startTime: z.string().min(1, "Choose a start time.").refine((value) => new Date(value).getTime() > Date.now(), "Start time must be in the future."),
  status: z.enum(["UPCOMING", "ONGOING", "ENDED", "CANCELLED"]),
  ticketTypes: z.array(ticketSchema).min(1),
});

type ConcertForm = z.infer<typeof concertSchema>;

export default function NewConcertPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const form = useForm<ConcertForm>({
    resolver: zodResolver(concertSchema),
    defaultValues: { title: "", description: "", startTime: "", status: "UPCOMING", ticketTypes: [{ name: "", price: 0, totalQuantity: 1 }] },
  });
  const tickets = useFieldArray({ control: form.control, name: "ticketTypes" });
  const mutation = useMutation({
    mutationFn: async (values: ConcertForm) => {
      const imageUrl = file ? (await mediaApi.upload(file)).url : undefined;
      return concertsApi.create({ ...values, imageUrl, startTime: new Date(values.startTime).toISOString() });
    },
    onSuccess: async () => {
      form.reset(form.getValues());
      await queryClient.invalidateQueries({ queryKey: ["admin-concerts"] });
      toast.success("Concert created.");
      router.push("/admin/concerts");
    },
  });

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!form.formState.isDirty && !file) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [file, form.formState.isDirty]);

  function chooseFile(selected?: File) {
    if (!selected) return setFile(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) return toast.error("Use a JPEG, PNG, or WebP image.");
    if (selected.size > 10 * 1024 * 1024) return toast.error("Image must be 10 MB or smaller.");
    setFile(selected);
  }

  const ticketErrors = Array.isArray(form.formState.errors.ticketTypes)
    ? form.formState.errors.ticketTypes.flatMap((ticket) => ticket ? [ticket.name?.message, ticket.price?.message, ticket.totalQuantity?.message] : [])
    : [];
  const errors = [
    form.formState.errors.title?.message,
    form.formState.errors.startTime?.message,
    ...ticketErrors,
    mutation.error ? errorMessage(mutation.error) : undefined,
  ].filter((message): message is string => Boolean(message));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold">Create concert</h1>
      <p className="mt-2 text-muted-foreground">Publish the event and its ticket types together.</p>
      <form className="mt-8 space-y-6" noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <FormErrorSummary messages={[...new Set(errors)]} />
        <Card><CardHeader><CardTitle>Concert details</CardTitle></CardHeader><CardContent className="grid gap-5">
          <Field><Label htmlFor="title">Title</Label><Input id="title" aria-invalid={Boolean(form.formState.errors.title)} aria-describedby={form.formState.errors.title ? "title-error" : undefined} {...form.register("title")} /><FieldError id="title-error" message={form.formState.errors.title?.message} /></Field>
          <Field><Label htmlFor="description">Description</Label><Textarea id="description" rows={5} {...form.register("description")} /></Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field><Label htmlFor="startTime">Start time</Label><Input id="startTime" type="datetime-local" aria-invalid={Boolean(form.formState.errors.startTime)} aria-describedby={form.formState.errors.startTime ? "start-time-error" : undefined} {...form.register("startTime")} /><FieldError id="start-time-error" message={form.formState.errors.startTime?.message} /></Field>
            <Field><Label htmlFor="status">Status</Label><select id="status" className="h-11 w-full rounded-lg border bg-background px-3 text-sm" {...form.register("status")}><option>UPCOMING</option><option>ONGOING</option><option>ENDED</option><option>CANCELLED</option></select></Field>
          </div>
          <Field><Label htmlFor="image">Concert image</Label><label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 text-sm hover:bg-muted"><ImagePlus aria-hidden="true" className="text-primary" /><span>{file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : "Choose JPEG, PNG, or WebP (max 10 MB)"}</span><input id="image" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseFile(event.target.files?.[0])} /></label></Field>
        </CardContent></Card>
        <Card><CardHeader><div className="flex items-center justify-between gap-4"><CardTitle>Ticket types</CardTitle><Button type="button" size="sm" variant="outline" onClick={() => tickets.append({ name: "", price: 0, totalQuantity: 1 })}><Plus />Add type</Button></div></CardHeader><CardContent className="space-y-4">
          {tickets.fields.map((ticket, index) => {
            const rowErrors = form.formState.errors.ticketTypes?.[index];
            return <fieldset key={ticket.id} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"><legend className="sr-only">Ticket type {index + 1}</legend><Field><Label className="sr-only" htmlFor={`ticket-name-${index}`}>Ticket name</Label><Input id={`ticket-name-${index}`} placeholder="VIP" aria-invalid={Boolean(rowErrors?.name)} aria-describedby={rowErrors?.name ? `ticket-name-${index}-error` : undefined} {...form.register(`ticketTypes.${index}.name`)} /><FieldError id={`ticket-name-${index}-error`} message={rowErrors?.name?.message} /></Field><Field><Label className="sr-only" htmlFor={`ticket-price-${index}`}>Price in VND</Label><Input id={`ticket-price-${index}`} type="number" min="0" placeholder="Price (VND)" aria-invalid={Boolean(rowErrors?.price)} aria-describedby={rowErrors?.price ? `ticket-price-${index}-error` : undefined} {...form.register(`ticketTypes.${index}.price`, { valueAsNumber: true })} /><FieldError id={`ticket-price-${index}-error`} message={rowErrors?.price?.message} /></Field><Field><Label className="sr-only" htmlFor={`ticket-quantity-${index}`}>Quantity</Label><Input id={`ticket-quantity-${index}`} type="number" min="1" placeholder="Quantity" aria-invalid={Boolean(rowErrors?.totalQuantity)} aria-describedby={rowErrors?.totalQuantity ? `ticket-quantity-${index}-error` : undefined} {...form.register(`ticketTypes.${index}.totalQuantity`, { valueAsNumber: true })} /><FieldError id={`ticket-quantity-${index}-error`} message={rowErrors?.totalQuantity?.message} /></Field><Button type="button" size="icon" variant="ghost" aria-label={`Remove ticket type ${index + 1}`} disabled={tickets.fields.length === 1} onClick={() => tickets.remove(index)}><Minus /></Button></fieldset>;
          })}
        </CardContent></Card>
        <div className="flex justify-end"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creating…" : "Create concert"}</Button></div>
      </form>
    </div>
  );
}
