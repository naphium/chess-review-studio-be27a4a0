import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Owner sign in — NafChessLog" },
      { name: "description", content: "Sign in to the NafChessLog owner portal." },
      { property: "og:title", content: "Owner sign in — NafChessLog" },
      { property: "og:description", content: "Sign in to manage NafChessLog." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else navigate({ to: "/owner" });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/owner" } });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Check your email to confirm your account, then sign in.");
      else navigate({ to: "/owner" });
    }
    setBusy(false);
  }

  async function forgot() {
    if (!email) return setMsg("Enter your email first.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
    setMsg(error ? error.message : "Password reset email sent.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="card-dash w-full max-w-sm space-y-4 p-6">
        <h1 className="font-display text-2xl font-bold">Owner portal</h1>
        <p className="text-sm text-muted-foreground">The first account created becomes the owner.</p>
        <input className="h-10 w-full rounded-md border border-input bg-background px-3" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="h-10 w-full rounded-md border border-input bg-background px-3" type="password" placeholder="Password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        {msg && <p className="text-sm text-primary">{msg}</p>}
        <button className="btn-primary w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</button>
        <div className="flex justify-between text-xs text-muted-foreground">
          <button type="button" className="hover:text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "Create an account" : "Have an account? Sign in"}
          </button>
          <button type="button" className="hover:text-primary" onClick={forgot}>Forgot password?</button>
        </div>
      </form>
    </div>
  );
}
