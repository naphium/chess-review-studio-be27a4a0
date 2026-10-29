<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Chess analysis
- Use the full single-thread Stockfish NNUE worker with CDN-hosted WASM, fixed-depth MultiPV searches, and complete-result caching; this preserves consistent evaluation strength without requiring cross-origin isolation.
- Keep exploratory legal moves in a separate variation and engine from original PGN review; exploration must never change original move classifications or accuracy.
