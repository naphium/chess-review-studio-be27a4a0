import { describe, it, expect } from "vitest";
import { estimateElo, accuracyToElo, gameAccuracy } from "./elo";

describe("estimateElo", () => {
  it("rates a near-perfect long game above 2400", () => {
    expect(estimateElo({ accuracy: 96, acpl: 12, counts: { best: 30, good: 10 }, moves: 40 }).elo).toBeGreaterThan(2400);
  });
  it("rates a blunder-heavy game below 1200", () => {
    expect(estimateElo({ accuracy: 50, acpl: 120, counts: { blunder: 6, mistake: 6, good: 18 }, moves: 30 }).elo).toBeLessThan(1200);
  });
  it("shrinks very short games toward 1500", () => {
    const e = estimateElo({ accuracy: 99, acpl: 2, counts: { best: 5 }, moves: 5 });
    expect(e.elo).toBeLessThan(1900);
    expect(e.confidence).toBe("low");
  });
  it("maps 75% accuracy to 1300", () => {
    expect(accuracyToElo(75)).toBe(1300);
  });
  it("rates a mediocre game (80% accuracy, 45 ACPL, 1 blunder) below 1700", () => {
    expect(estimateElo({ accuracy: 80, acpl: 45, counts: { best: 12, good: 15, mistake: 2, blunder: 1 }, moves: 30 }).elo).toBeLessThan(1700);
  });
  it("drags game accuracy down for blunders", () => {
    const acc = gameAccuracy([...Array(18).fill(100), 10, 10])!;
    expect(acc).toBeLessThan(75);
  });
});
