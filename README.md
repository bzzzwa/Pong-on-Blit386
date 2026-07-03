# Pong on BLIT386

A two-player Pong game played on a single keyboard, built with the
[BLIT386](https://blit386.dev) retro engine. The ball is a small square, the
paddles are rectangles sliding up and down along the left and right walls —
first player to 11 points wins.

**▶ Play it in your browser: <https://bzzzwa.github.io/Pong-on-Blit386/>**

## Controls

| Action | Player 1 (left paddle) | Player 2 (right paddle) |
| --- | --- | --- |
| Move up | `W` | `↑` |
| Move down | `S` | `↓` |

- **Space** — serve the ball (at the start and after every point), and start a
  new game once someone has won.

The ball bounces off the top and bottom walls and off the paddles. Where the
ball hits the paddle matters: a hit near the edge sends it off at a sharper
vertical angle than a hit in the middle, giving you a bit of control over your
returns.

## Getting started

You need [Node.js](https://nodejs.org) 22.18 or newer.

```bash
npm install
npm run dev
```

Vite prints a local address (typically <http://localhost:5173>) and opens it in
your browser. Leave the terminal running while you play.

### Other scripts

```bash
npm run build     # produce a production build in dist/
npm run preview   # serve the production build locally
```

## Deployment

The game is deployed to GitHub Pages automatically. Every push to `main`
triggers the workflow in `.github/workflows/deploy.yml`, which builds the
project and publishes `dist/` to Pages.

The site is served from a sub-path (`/Pong-on-Blit386/`), so `vite.config.js`
sets `base` to match. If you fork this project under a different repository
name, update that `base` value accordingly.

## Project structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml  # builds and deploys to GitHub Pages
├── index.html        # page host and canvas scaling
├── src/
│   └── game.js       # the whole game: configure / init / update / render
├── vite.config.js    # dev-server config and Pages base path
├── jsconfig.json     # editor type-checking settings
├── package.json
└── LICENSE
```

All the game logic lives in a single class in `src/game.js`. The tunable knobs
(paddle speed, ball speed, winning score, colors) are the constants near the top
of the file — change a number, save, and the browser reloads on its own.

## How it works

BLIT386 draws pixels and reads input; everything else — movement, collision,
scoring, game states — is plain JavaScript in `src/game.js`. The game runs on
WebGPU where available and falls back to a Canvas 2D renderer, so it renders
everywhere.

## Credits

- Built on the [BLIT386](https://blit386.dev) engine by Václav Vančura.
- Game by [@bzzzwa](https://github.com/bzzzwa) together with Claude Opus 4.8.

## License

Released under the [ISC License](LICENSE), matching the license of the BLIT386
engine.
