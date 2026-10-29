import { useDiscordPresence, type SiteSettings } from "@/lib/site-settings";

const STATUS: Record<string, string> = {
  online: "bg-cls-best", idle: "bg-cls-inaccuracy", dnd: "bg-cls-blunder", offline: "bg-muted-foreground",
};

export function OwnerCard({ s }: { s: SiteSettings }) {
  const { data: live } = useDiscordPresence(s.discord_user_id || undefined);
  const avatar = live?.avatar || s.avatar_url;
  const handle = live?.username || s.discord_username;
  const profileUrl = s.discord_user_id ? `https://discord.com/users/${s.discord_user_id}` : undefined;
  const links = [
    ["Portfolio", s.portfolio_url], ["GitHub", s.github_url], ["YouTube", s.youtube_url], ["X", s.x_url],
    ["Discord server", s.discord_server_invite], ["Buy Me a Coffee ☕", s.donate_url],
  ].filter(([, u]) => u);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
      <div className="flex items-center gap-3">
        <div className="relative">
          {avatar ? (
            <img src={avatar} alt={s.owner_name} className="h-12 w-12 rounded-full border border-border object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-display text-lg text-primary">
              {s.owner_name.slice(0, 1)}
            </div>
          )}
          {live && <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${STATUS[live.status]}`} />}
        </div>
        <div className="text-left">
          <p className="font-semibold text-foreground">Built by {live?.displayName && !s.owner_name ? live.displayName : s.owner_name}</p>
          {handle && (
            <a href={profileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
              Discord: @{handle}{live?.activity ? ` · ${live.activity}` : ""}
            </a>
          )}
        </div>
      </div>
      {s.owner_bio && <p className="text-sm">{s.owner_bio}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        {links.map(([label, url]) => (
          <a key={label} href={url} target="_blank" rel="noreferrer" className="chip">{label}</a>
        ))}
      </div>
    </div>
  );
}
