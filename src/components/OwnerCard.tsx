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
    <div className="mx-auto flex w-full max-w-3xl flex-col items-stretch gap-6 px-4 sm:flex-row sm:items-start sm:justify-between">
      {/* Left: Discord presence */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          {avatar ? (
            <img src={avatar} alt={name} className="h-12 w-12 rounded-full border border-border object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-display text-lg text-primary">
              {name.slice(0, 1)}
            </div>
          )}
          {live && <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${STATUS[live.status]}`} />}
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate font-semibold text-foreground">Built by {name}</p>
          {handle && (
            <a href={profileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
              Discord: @{handle}
            </a>
          )}
          {live && (
            <p className="truncate text-xs text-muted-foreground capitalize">
              {live.status}{live.activity ? ` · Playing ${live.activity}` : ""}
            </p>
          )}
          {s.owner_bio && <p className="mt-1 text-xs text-muted-foreground">{s.owner_bio}</p>}
        </div>
      </div>

      {/* Right: links */}
      <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
        {mainLinks.map(([label, url]) => (
          <a key={label} href={url} target="_blank" rel="noreferrer" className="btn-primary h-10 w-full justify-center text-xs sm:h-9 sm:w-auto">
            {label}
          </a>
        ))}
        {otherLinks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
            {otherLinks.map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noreferrer" className="chip">{label}</a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
