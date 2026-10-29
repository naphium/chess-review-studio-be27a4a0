import { Chessboard } from "react-chessboard";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { legalTargets, needsPromotion } from "@/lib/variation";

type Props = {
  fen: string;
  orientation: "white" | "black";
  lastMove?: { from: string; to: string };
  hint?: { from: string; to: string };
  onMove?: (from: string, to: string, promotion?: string) => boolean;
};

export default function Board({ fen, orientation, lastMove, hint, onMove }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<{ from: string; to: string } | null>(null);
  useEffect(() => { setSelected(null); setPromotion(null); }, [fen, onMove]);
  const submit = (from: string, to: string) => {
    if (!onMove || !legalTargets(fen, from).includes(to)) return false;
    if (needsPromotion(fen, from, to)) {
      setPromotion({ from, to });
      return false;
    }
    return onMove(from, to);
  };
  const styles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    styles[lastMove.from] = { background: "var(--board-highlight)" };
    styles[lastMove.to] = { background: "var(--board-highlight)" };
  }
  if (selected) {
    styles[selected] = { background: "var(--board-highlight)" };
    for (const to of legalTargets(fen, selected)) styles[to] = { boxShadow: "inset 0 0 0 5px var(--board-hint)" };
  }
  return (
    <div className="relative" aria-label={onMove ? "Playable analysis board" : "Match board"}>
    <Chessboard
      id="naf-board"
      position={fen}
      boardOrientation={orientation}
      arePiecesDraggable={!!onMove}
      onPieceDrop={(from, to) => submit(from, to)}
      onSquareClick={(square) => {
        if (!onMove) return;
        if (selected && submit(selected, square)) { setSelected(null); return; }
        setSelected(legalTargets(fen, square).length ? square : null);
      }}
      animationDuration={180}
      customSquareStyles={styles}
      customDarkSquareStyle={{ backgroundColor: "var(--board-dark)" }}
      customLightSquareStyle={{ backgroundColor: "var(--board-light)" }}
      customArrows={hint ? [[hint.from as never, hint.to as never, "var(--board-hint)"]] : []}
      customBoardStyle={{ borderRadius: "6px", boxShadow: "var(--shadow-board)" }}
    />
    {promotion && <div role="dialog" aria-label="Choose promotion" className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
      <div className="rounded-md border border-border bg-popover p-4 shadow-lg">
        <p className="mb-3 text-sm font-semibold">Promote to</p>
        <div className="flex gap-2">{([['q', 'Queen'], ['r', 'Rook'], ['b', 'Bishop'], ['n', 'Knight']] as const).map(([piece, label]) =>
          <Button key={piece} variant="secondary" size="sm" onClick={() => { onMove?.(promotion.from, promotion.to, piece); setPromotion(null); }}>{label}</Button>
        )}</div>
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setPromotion(null)}>Cancel</Button>
      </div>
    </div>}
    </div>
  );
}
