import { afterEach, describe, expect, it, vi } from "vitest";
import { Chess } from "chess.js";
import { Engine, SEARCH_DEPTH, splitRanges } from "./engine";

class FakeWorker {
  static workers: FakeWorker[] = [];
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  commands: string[] = [];
  constructor() { FakeWorker.workers.push(this); }
  postMessage(command: string | object) {
    if (typeof command !== "string") return; // shared engine-file hand-off
    this.commands.push(command);
    if (command === "uci") queueMicrotask(() => this.emit("uciok"));
    if (command === "isready") queueMicrotask(() => this.emit("readyok"));
  }
  emit(data: string) { this.onmessage?.({ data }); }
  terminate() {}
}

afterEach(() => { vi.unstubAllGlobals(); FakeWorker.workers = []; });

describe("quality-preserving engine", () => {
  it("serializes searches at depth 18 and reuses completed evaluations", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const engine = new Engine();
    await engine.isReady();
    const worker = FakeWorker.workers[0];
    const chess = new Chess();
    const firstFen = chess.fen();
    chess.move("e4");
    const first = engine.analyze(firstFen);
    const second = engine.analyze(chess.fen());
    await vi.waitFor(() => expect(worker.commands.filter((c) => c.startsWith("go"))).toEqual(["go depth 18"]));
    expect(SEARCH_DEPTH).toBe(18);
    worker.emit("info depth 18 multipv 1 score cp 30 pv e2e4 e7e5");
    worker.emit("bestmove e2e4");
    expect((await first).source).toBe("stockfish");
    await vi.waitFor(() => expect(worker.commands.filter((c) => c.startsWith("go"))).toHaveLength(2));
    worker.emit("info depth 18 multipv 1 score cp -20 pv e7e5 g1f3");
    worker.emit("bestmove e7e5");
    expect((await second).score.cp).toBe(20);
    await engine.analyze(firstFen);
    expect(worker.commands.filter((c) => c.startsWith("go"))).toHaveLength(2);
    engine.terminate();
  });
  it("hands every position to exactly one worker, in consecutive runs", () => {
    const runs = splitRanges(81, 12);
    expect(runs[0][0]).toBe(0);
    expect(runs[runs.length - 1][1]).toBe(81);
    runs.slice(1).forEach((r, i) => expect(r[0]).toBe(runs[i][1]));
    expect(splitRanges(3, 12)).toEqual([[0, 1], [1, 2], [2, 3]]);
  });
  it("does not substitute a weak evaluator when the engine cannot load", async () => {
    vi.stubGlobal("Worker", class { constructor() { throw new Error("Unavailable"); } });
    const engine = new Engine();
    await expect(engine.analyze(new Chess().fen(), 19)).rejects.toThrow("no weaker analysis has been substituted");
    engine.terminate();
  });
});