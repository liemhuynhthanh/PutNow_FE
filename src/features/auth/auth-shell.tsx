import { Logo } from "@/components/logo";

export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
        <div className="mb-8"><Logo /><h1 className="mt-8 text-3xl font-bold">{title}</h1><p className="mt-2 text-muted-foreground">{description}</p></div>
        {children}
      </div>
    </div>
  );
}
