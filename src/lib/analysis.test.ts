import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { classifyMove, sacrificedMaterial } from "./analysis";

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
  const bxe6 = () => new Chess("r4rk1/ppqn1ppp/2p1pnb1/6N1/2BP4/1Q2P2P/PP1N1PP1/R4RK1 w - - 7 14").move("Bxe6");

  it("recognizes QCx7WsmF 14. Bxe6 as a sound bishop-for-two-pawns sacrifice", () => {
    const move = bxe6();
    const before = { score: { cp: 63 }, lines: [{ uci: "c4e6", san: "Bxe6", score: { cp: 63 }, pv: ["Bxe6", "fxe6", "Nxe6"] }] };
    const after = { score: { cp: 62 }, lines: [] };
    expect(sacrificedMaterial(move)).toBe(1);
    expect(classifyMove(move, before, after).cls).toBe("brilliant");
  });

  it("does not reward the same sacrifice when the engine says it loses", () => {
    const before = { score: { cp: 63 }, lines: [{ uci: "g5f3", san: "Ngf3", score: { cp: 63 }, pv: [] }] };
    expect(classifyMove(bxe6(), before, { score: { cp: -400 }, lines: [] }).cls).toBe("blunder");
  });

  it("does not mark an undefended pawn as a brilliant piece sacrifice", () => {
    const move = new Chess("4k3/8/8/8/1p6/8/P7/4K3 w - - 0 1").move("a3");
    const ev = { score: { cp: 0 }, lines: [{ uci: "a2a3", san: "a3", score: { cp: 0 }, pv: [] }] };
    expect(sacrificedMaterial(move)).toBe(0);
    expect(classifyMove(move, ev, ev).cls).toBe("best");
  });

  it("does not mark an equal bishop trade as brilliant", () => {
    const trade = new Chess("4k3/8/8/3b4/2B5/8/8/4K3 w - - 0 1").move("Bxd5");
    const ev = { score: { cp: 0 }, lines: [{ uci: "c4d5", san: trade.san, score: { cp: 0 }, pv: [] }] };
    expect(classifyMove(trade, ev, ev).cls).toBe("best");
  });

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
