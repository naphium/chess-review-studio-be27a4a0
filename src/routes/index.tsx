import { createFileRoute } from "@tanstack/react-router";
import { Analyzer } from "@/components/chess/Analyzer";
import { OwnerCard } from "@/components/OwnerCard";
import { useSiteSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NafChessLog — Free PGN Chess Game Review" },
      { name: "description", content: "Paste a PGN and review your chess game with Stockfish: eval bar, move classifications, accuracy and best lines." },
      { property: "og:title", content: "NafChessLog — Free PGN Chess Game Review" },
      { property: "og:description", content: "Analyze chess games in your browser with Stockfish." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const s = useSiteSettings();
  const title = s?.site_title || "NafChessLog";
  const [a, b, c] = title === "NafChessLog" ? ["Naf", "Chess", "Log"] : [title, "", ""];
  return (
    <div className="flex min-h-screen flex-col">
      {s?.announcement_enabled && s.announcement && (
        <div className="bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">{s.announcement}</div>
      )}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3">
          <span className="text-2xl text-primary">♞</span>
          <h1 className="font-display text-xl font-bold tracking-tight">
            {a}<span className="text-primary">{b}</span>{c}
          </h1>
          <span className="ml-2 hidden text-sm text-muted-foreground sm:inline">{s?.tagline ?? "Game Review"}</span>
          <Link to="/portal" className="ml-auto text-xs text-muted-foreground hover:text-primary">Owner</Link>
        </div>
      </header>
      <main className="flex-1">
        <Analyzer defaultSound={s?.default_sound ?? true} defaultBlackView={s?.default_black_view ?? false} />
      </main>
      <footer className="border-t border-border py-6 text-sm text-muted-foreground">
        {s && <OwnerCard s={s} />}
        {s?.footer_note && <p className="mt-3 text-center text-xs">{s.footer_note}</p>}
        <p className="mt-3 text-center text-xs">Powered by chess.js and Stockfish WASM.</p>
      </footer>
    </div>
  );
}
