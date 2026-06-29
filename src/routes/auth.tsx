import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Author Manager" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/boss/author-manager/dashboard" });
    });
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const fn = mode === "signin"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    const { error } = await fn;
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(mode === "signin" ? "Signed in" : "Account created");
    nav({ to: "/boss/author-manager/dashboard" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border border-hairline bg-surface p-6">
        <div>
          <div className="text-lg font-semibold">Author Manager</div>
          <div className="text-xs text-muted-foreground">Boss Panel · sign {mode === "signin" ? "in" : "up"}</div>
        </div>
        <label className="block text-sm">
          <span className="text-xs text-muted-foreground">Email</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-2 px-2" />
        </label>
        <label className="block text-sm">
          <span className="text-xs text-muted-foreground">Password</span>
          <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-2 px-2" />
        </label>
        <button disabled={busy} className="h-10 w-full rounded-md bg-brand text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50">
          {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="block w-full text-center text-xs text-muted-foreground hover:text-foreground">
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
