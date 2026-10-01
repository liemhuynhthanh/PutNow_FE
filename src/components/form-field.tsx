"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} role="alert" className="text-sm text-destructive">{message}</p> : null;
}

export function PasswordInput({ id, ...props }: Omit<React.ComponentProps<typeof Input>, "type"> & { id: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={visible ? "text" : "password"} className="pr-12" {...props} />
      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible((value) => !value)}>
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
  );
}

export function FormErrorSummary({ messages }: { messages: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messages.length) ref.current?.focus();
  }, [messages]);
  if (!messages.length) return null;
  return (
    <Alert ref={ref} tabIndex={-1} variant="destructive">
      <AlertTitle>Please review the form</AlertTitle>
      <AlertDescription><ul className="list-disc space-y-1 pl-5">{messages.map((message) => <li key={message}>{message}</li>)}</ul></AlertDescription>
    </Alert>
  );
}

export { Label };
