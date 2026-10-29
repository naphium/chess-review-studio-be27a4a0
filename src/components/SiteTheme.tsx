import { useEffect } from "react";
import { useSiteSettings } from "@/lib/site-settings";

/** Applies the owner's chosen colors to the whole site. */
export function SiteTheme() {
  const s = useSiteSettings();
  useEffect(() => {
    if (!s) return;
    const root = document.documentElement.style;
    if (s.accent_color) { root.setProperty("--primary", s.accent_color); root.setProperty("--ring", s.accent_color); }
    if (s.board_light) root.setProperty("--board-light", s.board_light);
    if (s.board_dark) root.setProperty("--board-dark", s.board_dark);
    if (s.site_title) document.title = document.title.replace(/^NafChessLog/, s.site_title);
  }, [s]);
  return null;
}
