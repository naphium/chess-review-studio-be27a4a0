import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { siteSettingsQuery, type SiteSettings } from "@/lib/site-settings";
import { OwnerCard } from "@/components/OwnerCard";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [
      { title: "Owner portal — NafChessLog" },
      { name: "description", content: "Customize your NafChessLog profile, look and defaults." },
      { property: "og:title", content: "Owner portal — NafChessLog" },
      { property: "og:description", content: "Owner settings for NafChessLog." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Portal,
});

type Form = Omit<SiteSettings, "id" | "updated_at">;

function Portal() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: settings } = useQuery(siteSettingsQuery);
  const { data: isOwner, isLoading } = useQuery({
    queryKey: ["is-owner", user.id],
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })).data === true,
  });
  const [f, setF] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings && !f) {
      const { id: _i, updated_at: _u, ...rest } = settings;
      setF(rest);
    }
  }, [settings, f]);

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function save() {
    if (!f) return;
    setSaving(true);
    const { error } = await supabase.from("site_settings").update({ ...f, updated_at: new Date().toISOString() }).eq("id", 1);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved — changes are live.");
    qc.invalidateQueries({ queryKey: ["site-settings"] });
  }

  if (isLoading || !f) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!isOwner)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p>This account isn't the site owner.</p>
        <button className="btn-ghost" onClick={signOut}>Sign out</button>
      </div>
    );

  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setF({ ...f, [k]: v });
  const text = (k: keyof Form, label: string, ph = "", hint?: string) => (
    <Field label={label} hint={hint}>
      <input className="inp" value={f[k] as string} placeholder={ph} onChange={(e) => set(k)(e.target.value as never)} />
    </Field>
  );
  const color = (k: keyof Form, label: string) => (
    <Field label={label}>
      <div className="flex gap-2">
        <input type="color" className="h-10 w-12 rounded border border-input bg-background" value={f[k] as string} onChange={(e) => set(k)(e.target.value as never)} />
        <input className="inp" value={f[k] as string} onChange={(e) => set(k)(e.target.value as never)} />
      </div>
    </Field>
  );
  const check = (k: keyof Form, label: string) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={f[k] as boolean} onChange={(e) => set(k)(e.target.checked as never)} /> {label}
    </label>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold">Owner portal</h1>
        <Link to="/" className="btn-ghost ml-auto">View site</Link>
        <button className="btn-ghost" onClick={signOut}>Sign out</button>
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Profile">
          {text("owner_name", "Your name")}
          <Field label="Bio"><textarea className="inp min-h-20 py-2" value={f.owner_bio} onChange={(e) => set("owner_bio")(e.target.value)} /></Field>
          {text("avatar_url", "Avatar image link", "https://…", "Used when your live Discord picture isn't available.")}
        </Section>

        <Section title="Discord">
          {text("discord_user_id", "Discord user ID", "123456789012345678", "Fetches your live Discord picture, name and status. Enable Developer Mode in Discord → right-click yourself → Copy User ID, and join discord.gg/lanyard so it can be read.")}
          {text("discord_username", "Discord username (fallback)", "yourname")}
          {text("discord_server_invite", "Discord server invite", "https://discord.gg/…")}
        </Section>

        <Section title="Links">
          {text("portfolio_url", "Portfolio")}
          {text("github_url", "GitHub")}
          {text("youtube_url", "YouTube")}
          {text("x_url", "X / Twitter")}
          {text("donate_url", "Donation link")}
        </Section>

        <Section title="Site look">
          {text("site_title", "Site name")}
          {text("tagline", "Tagline")}
          {color("accent_color", "Accent color")}
          {color("board_light", "Board light squares")}
          {color("board_dark", "Board dark squares")}
        </Section>

        <Section title="Announcement">
          {check("announcement_enabled", "Show banner to visitors")}
          <Field label="Message"><textarea className="inp min-h-20 py-2" value={f.announcement} onChange={(e) => set("announcement")(e.target.value)} /></Field>
          {text("footer_note", "Footer note")}
        </Section>

        <Section title="Analysis defaults">
          {check("default_sound", "Move sounds on by default")}
          {check("default_black_view", "Show board from Black's side by default")}
          <p className="text-xs text-muted-foreground">Engine strength stays at full depth for every visitor.</p>
        </Section>
      </div>

      <h2 className="mt-8 mb-3 font-display text-lg font-semibold">Footer preview</h2>
      <div className="card-dash p-6 text-muted-foreground"><OwnerCard s={{ ...f, id: 1, updated_at: "" }} /></div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card-dash space-y-3 p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
