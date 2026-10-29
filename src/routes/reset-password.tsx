import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — NafChessLog" },
      { name: "description", content: "Set a new password for your NafChessLog owner account." },
      { property: "og:title", content: "Reset password — NafChessLog" },
      { property: "og:description", content: "Set a new password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) setMsg(error.message);
    else navigate({ to: "/owner" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="card-dash w-full max-w-sm space-y-4 p-6">
        <h1 className="font-display text-2xl font-bold">New password</h1>
        <input className="h-10 w-full rounded-md border border-input bg-background px-3" type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} required />
        {msg && <p className="text-sm text-primary">{msg}</p>}
        <button className="btn-primary w-full">Save password</button>
      </form>
    </div>
  );
}
