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
    worker.emit("info depth 18 multipv 2 score cp 20 pv d2d4 d7d5");
    worker.emit("bestmove e2e4");
    expect((await first).source).toBe("stockfish");
    await vi.waitFor(() => expect(worker.commands.filter((c) => c.startsWith("go"))).toHaveLength(2));
    worker.emit("info depth 18 multipv 1 score cp -20 pv e7e5 g1f3");
    worker.emit("info depth 18 multipv 2 score cp -30 pv c7c5 g1f3");
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
  it("rejects incomplete depth-18 lines and does not cache them", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const engine = new Engine();
    await engine.isReady();
    const worker = FakeWorker.workers[0];
    const chess = new Chess();
    chess.move("a3");
    const fen = chess.fen();
    const incomplete = engine.analyze(fen);
    const rejected = expect(incomplete).rejects.toThrow("incomplete search");
    await vi.waitFor(() => expect(worker.commands).toContain("go depth 18"));
    worker.emit("info depth 18 multipv 1 score cp -20 pv e7e5");
    worker.emit("info depth 17 multipv 2 score cp -30 pv d7d5");
    worker.emit("bestmove e7e5");
    await rejected;
    const retry = engine.analyze(fen);
    await vi.waitFor(() => expect(worker.commands.filter((c) => c.startsWith("go"))).toHaveLength(2));
    worker.emit("info depth 18 multipv 1 score cp -20 pv e7e5");
    worker.emit("info depth 18 multipv 2 score cp -30 pv d7d5");
    worker.emit("bestmove e7e5");
    expect((await retry).depth).toBe(18);
    engine.terminate();
  });
  it("drains cancelled searches before starting a new game", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const engine = new Engine();
    await engine.isReady();
    const worker = FakeWorker.workers[0];
    const chess = new Chess();
    chess.move("h3");
    const old = engine.analyze(chess.fen());
    const cancelled = expect(old).rejects.toThrow("Search cancelled");
    await vi.waitFor(() => expect(worker.commands).toContain("go depth 18"));
    engine.cancel();
    engine.newGame();
    chess.move("h6");
    const next = engine.analyze(chess.fen());
    expect(worker.commands).not.toContain("ucinewgame");
    worker.emit("bestmove e7e5");
    await cancelled;
    await vi.waitFor(() => expect(worker.commands.filter((c) => c.startsWith("go"))).toHaveLength(2));
    expect(worker.commands.indexOf("ucinewgame")).toBeLessThan(worker.commands.lastIndexOf("go depth 18"));
    worker.emit("info depth 18 multipv 1 score cp 20 pv e2e4");
    worker.emit("info depth 18 multipv 2 score cp 10 pv d2d4");
    worker.emit("bestmove e2e4");
    expect((await next).depth).toBe(18);
    engine.terminate();
  });
  it("settles readiness and queued work when terminated during loading", async () => {
    vi.stubGlobal("Worker", class extends FakeWorker {
      postMessage(command: string | object) { if (typeof command === "string") this.commands.push(command); }
    });
    const engine = new Engine();
    const result = engine.analyze(new Chess().fen(), 20);
    engine.terminate();
    expect(await engine.isReady()).toBe(false);
    await expect(result).rejects.toThrow("Search cancelled");
  });
  it("does not substitute a weak evaluator when the engine cannot load", async () => {
    vi.stubGlobal("Worker", class { constructor() { throw new Error("Unavailable"); } });
    const engine = new Engine();
    await expect(engine.analyze(new Chess().fen(), 19)).rejects.toThrow("no weaker analysis has been substituted");
    engine.terminate();
  });
});