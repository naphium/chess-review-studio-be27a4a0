import { useDiscordPresence, type SiteSettings } from "@/lib/site-settings";

const STATUS: Record<string, string> = {
  online: "bg-cls-best", idle: "bg-cls-inaccuracy", dnd: "bg-cls-blunder", offline: "bg-muted-foreground",
};

export function OwnerCard({ s }: { s: SiteSettings }) {
  const { data: live } = useDiscordPresence(s.discord_user_id || undefined);
  const avatar = live?.avatar || s.avatar_url;
  const handle = live?.username || s.discord_username;
  const name = live?.displayName && !s.owner_name ? live.displayName : s.owner_name;
  const profileUrl = s.discord_user_id ? `https://discord.com/users/${s.discord_user_id}` : undefined;
  const mainLinks = [
    ["Portfolio", s.portfolio_url],
    ["Buy Me a Coffee ☕", s.donate_url],
  ].filter(([, u]) => u);
  const otherLinks = [
    ["GitHub", s.github_url],
    ["YouTube", s.youtube_url],
    ["X", s.x_url],
    ["Discord server", s.discord_server_invite],
  ].filter(([, u]) => u);

  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-4">
      {/* Left: Discord presence */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="relative shrink-0">
          {avatar ? (
            <img src={avatar} alt={name} className="h-10 w-10 rounded-full border border-border object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-display text-primary">
              {name.slice(0, 1)}
            </div>
          )}
          {live && <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${STATUS[live.status]}`} />}
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-semibold text-foreground">Built by {name}</p>
          {handle && (
            <a href={profileUrl} target="_blank" rel="noreferrer" className="block truncate text-xs text-primary hover:underline">
              @{handle}
            </a>
          )}
          {live && (
            <p className="truncate text-xs text-muted-foreground capitalize">
              {live.status}{live.activity ? ` · ${live.activity}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Right: links */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {mainLinks.map(([label, url]) => (
          <a key={label} href={url} target="_blank" rel="noreferrer" className="btn-primary h-8 px-3 text-xs">
            {label}
          </a>
        ))}
        {otherLinks.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {otherLinks.map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noreferrer" className="chip">{label}</a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
