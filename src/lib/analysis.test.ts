import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { classifyMove } from "./analysis";

describe("classifyMove", () => {
  it("gives the engine's top move 100% accuracy even if the next eval drops", () => {
    const c = new Chess();
    const move = c.move("e4");
    const before = { score: { cp: 40 }, lines: [{ uci: "e2e4", san: "e4", score: { cp: 40 }, pv: ["e4"] }] };
    const after = { score: { cp: -60 }, lines: [] };
    const r = classifyMove(move, before, after);
    expect(r.accuracy).toBe(100);
    expect(r.loss).toBe(0);
  });
});

describe("book and brilliant", () => {
  it("tags opening theory as book with no accuracy penalty", async () => {
    const { bookFlags } = await import("./book");
    expect(bookFlags(["e4", "e5", "Nf3", "Nc6", "Bb5", "h5"])).toEqual([true, true, true, true, true, false]);
  });
  it("marks a sound piece sacrifice that stays best as brilliant", () => {
    const fen = "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1";
    const sac = new Chess(fen).move("Ng5"); // knight left hanging to Qxg5
    const ev = { score: { cp: 30 }, lines: [{ uci: "f3g5", san: "Ng5", score: { cp: 30 }, pv: [] }] };
    expect(classifyMove(sac, ev, ev).cls).toBe("brilliant");
  });
  it("does not call a defended pawn push a sacrifice", () => {
    const fen = "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1";
    const push = new Chess(fen).move("d4"); // exd4 is met by Qxd4/Nxd4
    const ev = { score: { cp: 30 }, lines: [{ uci: "d2d4", san: "d4", score: { cp: 30 }, pv: [] }] };
    expect(classifyMove(push, ev, ev).cls).toBe("best");
  });
});
