import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { legalTargets, needsPromotion, playVariation, variationFen } from "./variation";

describe("playable analysis", () => {
  it("accepts legal moves and rejects illegal moves", () => {
    const fen = new Chess().fen();
    expect(playVariation(fen, "e2", "e4")?.san).toBe("e4");
    expect(playVariation(fen, "e2", "e5")).toBeNull();
    expect(legalTargets(fen, "e2")).toEqual(["e3", "e4"]);
  });
  it("returns to the exact original position without changing match history", () => {
    const match = new Chess();
    match.move("d4");
    const original = match.fen();
    const move = playVariation(original, "g8", "f6");
    if (!move) throw new Error("Expected legal move");
    expect(variationFen(original, { originPly: 1, moves: [move] })).toBe(move.after);
    expect(variationFen(original, null)).toBe(original);
    expect(match.history()).toEqual(["d4"]);
  });
  it("supports explicit underpromotion rather than silently choosing a queen", () => {
    const fen = "7k/P7/8/8/8/8/8/7K w - - 0 1";
    expect(needsPromotion(fen, "a7", "a8")).toBe(true);
    expect(playVariation(fen, "a7", "a8", "n")?.promotion).toBe("n");
  });
});