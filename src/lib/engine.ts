import { Chess } from "chess.js";
import engineAsset from "@/assets/stockfish-19.wasm.asset.json";

export type Score = { cp: number; mate?: number }; // white perspective
export type Line = { uci: string; san: string; score: Score; pv: string[] };
export type EvalSource = "stockfish" | "terminal";
export type PositionEval = { score: Score; lines: Line[]; source?: EvalSource; depth?: number };
export const SEARCH_DEPTH = 18;

export function scoreToNum(s: Score): number {
  if (s.mate !== undefined) return s.mate === 0 ? 0 : Math.sign(s.mate) * (10000 - Math.abs(s.mate) * 10);
  return s.cp;
}

function uciToSan(fen: string, pv: string[]): string[] {
  const c = new Chess(fen);
  const out: string[] = [];
  for (const u of pv.slice(0, 8)) {
    try { out.push(c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san); }
    catch { break; }
  }
  return out;
}

// Only completed, full-depth searches are reused across review and exploration.
const cache = new Map<string, PositionEval>();

export class Engine {
  private worker: Worker | null = null;
  private ready: Promise<boolean>;
  private queue: Promise<unknown> = Promise.resolve();
  private epoch = 0;
  private activeReject: ((error: Error) => void) | null = null;
  public usingStockfish = false;

  constructor() {
    this.ready = new Promise((resolve) => {
      try {
        const wasmUrl = new URL(engineAsset.url, window.location.origin).href;
        const w = new Worker(`/engine/stockfish-19/stockfish-19-single.js#${encodeURIComponent(wasmUrl)}`);
        this.worker = w;
        const timer = setTimeout(() => { w.terminate(); this.worker = null; resolve(false); }, 120000);
        w.onmessage = (e) => {
          const msg = String(e.data);
          if (msg === "uciok") {
            w.postMessage("setoption name MultiPV value 2");
            w.postMessage("setoption name Hash value 64");
            w.postMessage("isready");
          } else if (msg === "readyok") {
            clearTimeout(timer);
            this.usingStockfish = true;
            resolve(true);
          }
        };
        w.onerror = () => { clearTimeout(timer); w.terminate(); this.worker = null; resolve(false); };
        w.postMessage("uci");
      } catch { resolve(false); }
    });
  }

  async isReady() { return this.ready; }

  /** Drop queued exploration requests; an active search drains before the next begins. */
  cancel() {
    this.epoch++;
    this.worker?.postMessage("stop");
  }

  /** Clear the engine's hash before a new game; runs after any active search drains. */
  newGame() {
    this.queue = this.queue.then(async () => {
      if (await this.ready) this.worker?.postMessage("ucinewgame");
    }).catch(() => undefined);
  }

  analyze(fen: string, depth = SEARCH_DEPTH): Promise<PositionEval> {
    const epoch = this.epoch;
    const job = this.queue.then(() => {
      if (epoch !== this.epoch) throw new Error("Search cancelled");
      return this.run(fen, depth, epoch);
    });
    this.queue = job.catch(() => undefined);
    return job;
  }

  private async run(fen: string, depth: number, epoch: number): Promise<PositionEval> {
    const c = new Chess(fen);
    if (c.isCheckmate()) return { score: { cp: c.turn() === "w" ? -10000 : 10000 }, lines: [], source: "terminal" };
    if (c.isGameOver()) return { score: { cp: 0 }, lines: [], source: "terminal" };
    const key = `${depth}:${fen}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const ok = await this.ready;
    if (epoch !== this.epoch) throw new Error("Search cancelled");
    if (!ok || !this.worker) throw new Error("Stockfish could not load. Check your connection and reload; no weaker analysis has been substituted.");
    const side = c.turn() === "w" ? 1 : -1;
    const w = this.worker;
    return new Promise((resolve, reject) => {
      const lines: Record<number, { score: Score; pv: string[]; depth: number }> = {};
      let settled = false;
      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.activeReject = null;
        reject(error);
      };
      this.activeReject = fail;
      const timer = setTimeout(() => {
        w.terminate(); this.worker = null; this.usingStockfish = false;
        fail(new Error("The engine search timed out. Reload to retry; incomplete results were not used."));
      }, 180000);
      w.onerror = () => { w.terminate(); this.worker = null; fail(new Error("The chess engine stopped. Reload to retry.")); };
      w.onmessage = (e) => {
        const msg = String(e.data);
        if (msg.startsWith("info") && msg.includes(" pv ") && !msg.includes("bound")) {
          const mpv = Number(/multipv (\d+)/.exec(msg)?.[1] ?? 1);
          const cp = /score cp (-?\d+)/.exec(msg);
          const mate = /score mate (-?\d+)/.exec(msg);
          if (!cp && !mate) return;
          const score: Score = mate ? { cp: 0, mate: Number(mate[1]) * side } : { cp: Number(cp?.[1] ?? 0) * side };
          lines[mpv] = { score, pv: msg.split(" pv ")[1].trim().split(" "), depth: Number(/\bdepth (\d+)/.exec(msg)?.[1] ?? 0) };
        } else if (msg.startsWith("bestmove")) {
          if (epoch !== this.epoch) { fail(new Error("Search cancelled")); return; }
          const out: Line[] = [1, 2].flatMap((k) => {
            const line = lines[k];
            if (!line) return [];
            const sans = uciToSan(fen, line.pv);
            return [{ uci: line.pv[0], san: sans[0] ?? line.pv[0], score: line.score, pv: sans }];
          });
          const top = lines[1];
          if (!top || !out.length) { fail(new Error("The engine returned no complete evaluation.")); return; }
          const result: PositionEval = { score: out[0].score, lines: out, source: "stockfish", depth: top.depth };
          if (top.depth >= depth) {
            if (cache.size >= 2000) { const first = cache.keys().next().value; if (first) cache.delete(first); }
            cache.set(key, result);
          }
          settled = true;
          clearTimeout(timer);
          this.activeReject = null;
          w.onmessage = null;
          resolve(result);
        }
      };
      // Same fixed depth for every position. The hash table is kept between consecutive
      // positions of one game (cleared per game via newGame), which speeds searches
      // without lowering depth or search quality.
      w.postMessage(`position fen ${fen}`);
      w.postMessage(`go depth ${depth}`);
    });
  }

  terminate() {
    this.epoch++;
    this.activeReject?.(new Error("Search cancelled"));
    this.worker?.terminate();
    this.worker = null;
  }
}

/** Split positions into contiguous runs so each worker reuses its hash on consecutive moves. */
export function splitRanges(count: number, parts: number): [number, number][] {
  const k = Math.max(1, Math.min(parts, count));
  const out: [number, number][] = [];
  for (let i = 0; i < k; i++) {
    const start = Math.floor((i * count) / k), end = Math.floor(((i + 1) * count) / k);
    if (end > start) out.push([start, end]);
  }
  return out;
}
