import { defineConfig } from 'vite';

// Vite is the little web server that runs the game while you work on it.
//
// `base` is the sub-path the site is served from. On GitHub Pages the project
// lives at https://bzzzwa.github.io/Pong-on-Blit386/, so assets must be
// referenced relative to that sub-directory. Locally (`npm run dev`) the base
// is always '/', so this only affects production builds.
export default defineConfig({
    base: '/Pong-on-Blit386/',
    server: {
        open: true,
    },
});
