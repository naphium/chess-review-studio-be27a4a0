// Compact opening book: common mainline openings as SAN sequences.
const LINES = [
  "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3",
  "e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5",
  "e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6 O-O f6",
  "e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O",
  "e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Be7 O-O O-O",
  "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5",
  "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5",
  "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6",
  "e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5 Bb4",
  "e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 d4 d5",
  "e4 e5 Nf3 d6 d4 Nf6 Nc3 Nbd7",
  "e4 e5 f4 exf4 Nf3 g5",
  "e4 e5 Nc3 Nf6 f4 d5",
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6",
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O",
  "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6",
  "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7",
  "e4 c5 Nf3 Nc6 Bb5 g6 O-O Bg7",
  "e4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7",
  "e4 c5 c3 Nf6 e5 Nd5 d4 cxd4",
  "e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5 Nfd7",
  "e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3 bxc3",
  "e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6",
  "e4 e6 d4 d5 Nd2 Nf6 e5 Nfd7",
  "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6",
  "e4 c6 d4 d5 e5 Bf5 Nf3 e6",
  "e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3",
  "e4 d6 d4 Nf6 Nc3 g6 f4 Bg7",
  "e4 g6 d4 Bg7 Nc3 d6",
  "e4 Nf6 e5 Nd5 d4 d6 Nf3",
  "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3",
  "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5",
  "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5",
  "d4 d5 Nf3 Nf6 Bf4 e6 e3 c5 c3 Nc6",
  "d4 d5 Bf4 Nf6 e3 e6 Nf3 c5",
  "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5",
  "d4 Nf6 c4 e6 Nc3 Bb4 Qc2 O-O a3 Bxc3",
  "d4 Nf6 c4 e6 Nf3 b6 g3 Ba6",
  "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O",
  "d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7",
  "d4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6",
  "d4 Nf6 Nf3 g6 Bf4 Bg7 e3 O-O",
  "d4 f5 g3 Nf6 Bg2 g6",
  "c4 e5 Nc3 Nf6 Nf3 Nc6 g3 d5",
  "c4 Nf6 Nc3 e6 e4 d5 e5",
  "c4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7",
  "Nf3 d5 g3 Nf6 Bg2 c6 O-O Bg4",
  "Nf3 Nf6 c4 g6 Nc3 Bg7 e4 d6",
  "g3 d5 Bg2 Nf6 Nf3",
  "b3 e5 Bb2 Nc6 e3",
];

const BOOK = new Set<string>();
for (const l of LINES) {
  const m = l.split(" ");
  for (let i = 1; i <= m.length; i++) BOOK.add(m.slice(0, i).join(" "));
}

/** For each ply, whether the game is still inside the opening book. */
export function bookFlags(sans: string[]): boolean[] {
  const out: boolean[] = [];
  let inBook = true;
  for (let i = 0; i < sans.length; i++) {
    inBook = inBook && BOOK.has(sans.slice(0, i + 1).join(" "));
    out.push(inBook);
  }
  return out;
}
