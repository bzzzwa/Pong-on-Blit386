# Tenis (Pong) — BLIT386

Dvouhráčová hra tenis/Pong na jedné klávesnici, postavená na retro enginu BLIT386.

## Ovládání

- **Hráč 1 (levá pálka):** `W` nahoru, `S` dolů
- **Hráč 2 (pravá pálka):** šipka `↑` nahoru, šipka `↓` dolů
- **Mezerník:** podání míče (na startu a po každém bodu), a nová hra po výhře

Pálka se pohybuje nahoru a dolů podél své stěny, míč je čtvereček a odráží se
od stěn i od pálek. Zásah u kraje pálky odráží míč prudčeji než zásah doprostřed.
Kdo první získá 11 bodů, vyhrává.

## Spuštění

Potřebuješ Node.js (verze 22.18 nebo novější).

```bash
npm install
npm run dev
```

Otevře se prohlížeč s hrou (typicky http://localhost:5173).

## Kde ladit

Otevři `src/game.js`. Nahoře jsou konstanty jako `PADDLE_SPEED`, `BALL_SPEED_X`
nebo `WIN_SCORE` — změň číslo, ulož, prohlížeč se sám obnoví.
