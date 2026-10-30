# Chess Review Studio

Build the chess game review app from https://github.com/naphium/nafchesslog with an interactive board, PGN import, move classifications (brilliant, great, best, excellent, good, inaccuracy, mistake, miss, blunder), performance rating estimation, and fixed game review logic: ensure top engine moves are not penalized with artificial accuracy loss, avoid mixing mismatched cloud and local evaluation depths mid-game, and ensure engine searches are properly serialized.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d4f73747-5ec7-43f8-957e-8afd93eaacc9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
