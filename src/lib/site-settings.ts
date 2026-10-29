import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];

export const siteSettingsQuery = queryOptions({
  queryKey: ["site-settings"],
  queryFn: async (): Promise<SiteSettings | null> => {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data;
  },
  staleTime: 60_000,
});

export function useSiteSettings() {
  return useQuery(siteSettingsQuery).data ?? null;
}

export type DiscordPresence = {
  username: string;
  displayName: string;
  avatar: string | null;
  status: "online" | "idle" | "dnd" | "offline";
  activity: string | null;
};

/** Live Discord profile via Lanyard (works when the owner has joined discord.gg/lanyard). */
export function useDiscordPresence(userId: string | undefined) {
  return useQuery({
    queryKey: ["discord", userId],
    enabled: !!userId && /^\d{15,21}$/.test(userId),
    retry: false,
    refetchInterval: 60_000,
    queryFn: async (): Promise<DiscordPresence | null> => {
      const r = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
      if (!r.ok) return null;
      const j = await r.json();
      if (!j.success) return null;
      const u = j.data.discord_user;
      const act = (j.data.activities ?? []).find((a: { type: number }) => a.type !== 4);
      return {
        username: u.username,
        displayName: u.global_name || u.username,
        avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128` : null,
        status: j.data.discord_status,
        activity: act?.name ?? null,
      };
    },
  });
}
