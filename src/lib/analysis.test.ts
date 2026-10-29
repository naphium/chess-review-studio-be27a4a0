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
