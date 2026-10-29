import { Chess, type Move, type Square } from "chess.js";

export type Variation = { originPly: number; moves: Move[] };

export function variationFen(originalFen: string, variation: Variation | null): string {
  return variation?.moves.at(-1)?.after ?? originalFen;
}

export function legalTargets(fen: string, from: string): string[] {
  return new Chess(fen).moves({ square: from as Square, verbose: true }).map((move) => move.to);
}

export function playVariation(fen: string, from: string, to: string, promotion?: string): Move | null {
  try {
    return new Chess(fen).move({ from, to, promotion });
  } catch {
    return null;
  }
}

export function needsPromotion(fen: string, from: string, to: string): boolean {
  return new Chess(fen).moves({ square: from as Square, verbose: true }).some((move) => move.to === to && !!move.promotion);
}