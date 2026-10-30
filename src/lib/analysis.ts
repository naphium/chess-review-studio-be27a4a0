import { Chess, type Move } from "chess.js";
import { scoreToNum, type PositionEval } from "./engine";

export type Classification =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "miss"
  | "blunder";

export const CLASS_META: Record<Classification, { label: string; symbol: string }> = {
  brilliant: { label: "Brilliant", symbol: "!!" },
  book: { label: "Book", symbol: "📖" },
  great: { label: "Great", symbol: "!" },
  best: { label: "Best", symbol: "★" },
  excellent: { label: "Excellent", symbol: "👍" },
  good: { label: "Good", symbol: "✓" },
  inaccuracy: { label: "Inaccuracy", symbol: "?!" },
  mistake: { label: "Mistake", symbol: "?" },
  miss: { label: "Miss", symbol: "✕" },
  blunder: { label: "Blunder", symbol: "??" },
};

export type ParsedGame = { headers: Record<string, string>; moves: Move[]; fens: string[] };

export function parsePgn(pgn: string): ParsedGame {
  const text = pgn.trim();
  if (!text) throw new Error("Please paste a PGN first.");
  const c = new Chess();
  try {
    c.loadPgn(text);
  } catch (e) {
    throw new Error(`Invalid PGN: ${(e as Error).message?.split("\n")[0] ?? "could not parse"}`);
  }
  const moves = c.history({ verbose: true });
  if (moves.length === 0) throw new Error("This PGN contains no moves.");
  const fens = [moves[0].before, ...moves.map((m) => m.after)];
  return { headers: c.getHeaders() as Record<string, string>, moves, fens };
}

const VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const cap = (n: number) => Math.max(-1500, Math.min(1500, n));

export function winPct(cp: number) {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

function evalNum(e: PositionEval, fen: string): number {
  const c = new Chess(fen);
  if (c.isCheckmate()) return c.turn() === "w" ? -10000 : 10000;
  return scoreToNum(e.score);
}

/**
 * Piece material the mover leaves en prise after the move: the most the opponent can win
 * with a single capture (simple exchange: captured value minus recapture risk).
 */
export function sacrificedMaterial(move: Move): number {
  const c = new Chess(move.after);
  const me = move.color;
  let best = 0;
  for (const r of c.moves({ verbose: true })) {
    // Brilliant requires risking a piece, not merely an undefended pawn.
    if (!r.captured || r.captured === "p") continue;
    const gained = VAL[r.captured];
    c.move(r);
    const defended = c.isAttacked(r.to, me);
    c.undo();
    const net = defended ? gained - VAL[r.piece] : gained;
    if (net > best) best = net;
  }
  // Material we just won with this move offsets what we leave hanging.
  return best - (move.captured ? VAL[move.captured] : 0);
}

export function classifyMove(move: Move, before: PositionEval, after: PositionEval, book = false): {
  cls: Classification;
  loss: number;
  accuracy: number;
} {
  if (book) return { cls: "book", loss: 0, accuracy: 100 };
  const sign = move.color === "w" ? 1 : -1;
  const b = cap(evalNum(before, move.before) * sign);
  const a = cap(evalNum(after, move.after) * sign);
  const uci = move.from + move.to + (move.promotion ?? "");
  const isBest = before.lines[0]?.uci === uci;
  // The engine's top move cannot lose value; any drop is search-depth noise.
  const loss = isBest ? 0 : Math.max(0, b - a);
  const wl = isBest ? 0 : Math.max(0, winPct(b) - winPct(a));
  const accuracy = isBest ? 100 : Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * wl) - 3.1669));

  let cls: Classification;
  if (isBest || wl < 1) {
    cls = "best";
    const second = before.lines[1] ? cap(scoreToNum(before.lines[1].score) * sign) : null;
    // Brilliant (Chess.com style): a sound sacrifice — real material is left en prise,
    // the move is still (near) best, the position stays good, and we weren't already totally winning.
    // A bishop for two pawns still concedes material (3 - 1 - 1 = 1).
    // Requiring two points incorrectly excluded these sound sacrifices.
    const sacrifice = !move.promotion && sacrificedMaterial(move) >= 1;
    if (sacrifice && a >= -50 && b < 700) cls = "brilliant";
    else if (isBest && second !== null && b - second >= 150 && a > -200) cls = "great";
  } else if (wl < 3) cls = "excellent";
  else if (wl < 6) cls = "good";
  else if (wl < 10) cls = "inaccuracy";
  // Miss: a clearly winning chance was available but not taken, yet the position isn't lost
  else if (b >= 200 && a > -100 && a < b - 150 && wl < 30) cls = "miss";
  else if (wl < 20) cls = "mistake";
  else cls = "blunder";
  return { cls, loss, accuracy };
}

export function formatScore(e: { cp: number; mate?: number } | undefined): string {
  if (!e) return "0.0";
  if (e.mate !== undefined) return `${e.mate < 0 ? "-" : ""}M${Math.abs(Math.round(e.mate))}`;
  if (Math.abs(e.cp) >= 10000) return e.cp > 0 ? "1-0" : "0-1";
  const v = e.cp / 100;
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}`;
}
