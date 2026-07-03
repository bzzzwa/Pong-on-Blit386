// Tenis - dvouhráčová hra typu Pong pro BLIT386.
//
// Dva hráči na jedné klávesnici:
//   Hráč 1 (levá pálka):  W = nahoru, S = dolů
//   Hráč 2 (pravá pálka): šipka nahoru / šipka dolů
//   Mezerník = podání míče (na začátku a po každém bodu)
//
// Míč je čtvereček, pálky jsou obdélníky, které se pohybují nahoru a dolů
// podél levé a pravé stěny. Kdo dosáhne WIN_SCORE bodů, vyhrává.
//
// Struktura každé BLIT386 hry je jedna třída se čtyřmi metodami:
//   configure() - jednou, nastaví velikost obrazovky a FPS
//   init()      - jednou na startu, nastaví barvy a výchozí stav
//   update()    - ~60x/s, čte vstup, hýbe věcmi, řeší kolize a skóre
//   render()    - ~60x/s, vykreslí aktuální stav

import { bootstrap, BT, Color32, Rect2i, Vector2i } from 'blit386';

// --- Barevné sloty (skutečné barvy nastavíme v init()) --------------------
// Slot 0 je vždy průhledný, proto začínáme od 1.
const COLOR_BG = 1; // pozadí
const COLOR_FG = 2; // pálky, míč, střední čára
const COLOR_TEXT = 3; // skóre a texty

// --- Rozměry a rychlosti (nejzábavnější knoflíky k ladění) ----------------
const SCREEN_W = 320;
const SCREEN_H = 240;

const PADDLE_W = 6; // šířka pálky
const PADDLE_H = 40; // výška pálky
const PADDLE_SPEED = 3; // o kolik pixelů se pálka posune za krok
const PADDLE_MARGIN = 10; // odsazení pálky od boční stěny

const BALL_SIZE = 6; // strana čtverečku míče
const BALL_SPEED_X = 3; // vodorovná rychlost míče
const BALL_START_SPEED_Y = 2; // svislá rychlost míče při podání

const WIN_SCORE = 11; // kolik bodů znamená výhru

// Stavy hry
const STATE_SERVE = 'serve'; // čeká se na podání (mezerník)
const STATE_PLAY = 'play'; // míč je ve hře
const STATE_OVER = 'over'; // někdo vyhrál

class Game {
    configure() {
        return {
            displaySize: new Vector2i(SCREEN_W, SCREEN_H),
            targetFPS: 60,
        };
    }

    async init() {
        // Paleta barev - retro černobílé ladění.
        const palette = BT.paletteCreate(16);
        palette.set(COLOR_BG, new Color32(12, 14, 20)); // téměř černá
        palette.set(COLOR_FG, new Color32(235, 240, 255)); // téměř bílá
        palette.set(COLOR_TEXT, new Color32(120, 200, 160)); // tlumená zelená
        BT.paletteSet(palette);

        // Levá pálka (hráč 1) a pravá pálka (hráč 2), obě svisle vystředěné.
        const paddleY = Math.floor((SCREEN_H - PADDLE_H) / 2);
        this.leftPaddle = new Rect2i(PADDLE_MARGIN, paddleY, PADDLE_W, PADDLE_H);
        this.rightPaddle = new Rect2i(
            SCREEN_W - PADDLE_MARGIN - PADDLE_W,
            paddleY,
            PADDLE_W,
            PADDLE_H,
        );

        // Míč a jeho směr.
        this.ball = new Rect2i(0, 0, BALL_SIZE, BALL_SIZE);
        this.ballDX = 0;
        this.ballDY = 0;

        // Skóre.
        this.scoreLeft = 0;
        this.scoreRight = 0;

        // Kdo podává jako první (1 = doleva, tj. míč letí k hráči 1).
        this.serveDir = Math.random() < 0.5 ? -1 : 1;

        this.state = STATE_SERVE;
        this.winner = 0;

        this.centerBall();
        return true;
    }

    // Postaví míč doprostřed a zastaví ho (připraven k podání).
    centerBall() {
        this.ball.x = Math.floor((SCREEN_W - BALL_SIZE) / 2);
        this.ball.y = Math.floor((SCREEN_H - BALL_SIZE) / 2);
        this.ballDX = 0;
        this.ballDY = 0;
    }

    // Rozehraje míč směrem podle serveDir (-1 doleva, +1 doprava).
    serveBall() {
        this.ballDX = BALL_SPEED_X * this.serveDir;
        // Náhodný svislý směr, ať to není pokaždé stejné.
        this.ballDY = Math.random() < 0.5 ? -BALL_START_SPEED_Y : BALL_START_SPEED_Y;
        this.state = STATE_PLAY;
    }

    // Posune pálku o dané delta a udrží ji na obrazovce.
    movePaddle(paddle, delta) {
        paddle.y += delta;
        if (paddle.y < 0) {
            paddle.y = 0;
        }
        const maxY = SCREEN_H - PADDLE_H;
        if (paddle.y > maxY) {
            paddle.y = maxY;
        }
    }

    update() {
        // --- Ovládání pálek (funguje ve všech stavech, ať se hráči rozehřejí) ---
        // Hráč 1: W / S
        if (BT.isKeyDown('KeyW')) {
            this.movePaddle(this.leftPaddle, -PADDLE_SPEED);
        }
        if (BT.isKeyDown('KeyS')) {
            this.movePaddle(this.leftPaddle, PADDLE_SPEED);
        }
        // Hráč 2: šipky nahoru / dolů
        if (BT.isKeyDown('ArrowUp')) {
            this.movePaddle(this.rightPaddle, -PADDLE_SPEED);
        }
        if (BT.isKeyDown('ArrowDown')) {
            this.movePaddle(this.rightPaddle, PADDLE_SPEED);
        }

        // --- Stavová logika ---
        if (this.state === STATE_SERVE) {
            // Míč drží uprostřed, dokud někdo nezmáčkne mezerník.
            if (BT.isKeyPressed('Space')) {
                this.serveBall();
            }
            return;
        }

        if (this.state === STATE_OVER) {
            // Mezerník spustí novou hru od nuly.
            if (BT.isKeyPressed('Space')) {
                this.scoreLeft = 0;
                this.scoreRight = 0;
                this.winner = 0;
                this.serveDir = Math.random() < 0.5 ? -1 : 1;
                this.state = STATE_SERVE;
                this.centerBall();
            }
            return;
        }

        // --- STATE_PLAY: pohyb míče ---
        this.ball.x += this.ballDX;
        this.ball.y += this.ballDY;

        // Odraz od horní a dolní stěny.
        if (this.ball.y <= 0) {
            this.ball.y = 0;
            this.ballDY = Math.abs(this.ballDY);
        }
        const maxBallY = SCREEN_H - BALL_SIZE;
        if (this.ball.y >= maxBallY) {
            this.ball.y = maxBallY;
            this.ballDY = -Math.abs(this.ballDY);
        }

        // Odraz od pálek. Míč musí letět směrem k pálce, jinak by se "zasekl".
        if (this.ballDX < 0 && this.ball.isIntersecting(this.leftPaddle)) {
            this.ball.x = this.leftPaddle.x + PADDLE_W; // vytlač míč před pálku
            this.ballDX = Math.abs(this.ballDX);
            this.applyPaddleSpin(this.leftPaddle);
        } else if (this.ballDX > 0 && this.ball.isIntersecting(this.rightPaddle)) {
            this.ball.x = this.rightPaddle.x - BALL_SIZE;
            this.ballDX = -Math.abs(this.ballDX);
            this.applyPaddleSpin(this.rightPaddle);
        }

        // Míč přeletěl levou stěnu -> bod pro hráče 2 (vpravo).
        if (this.ball.x + BALL_SIZE < 0) {
            this.scoreRight += 1;
            this.serveDir = -1; // podává se směrem k tomu, kdo dostal bod
            this.afterPoint();
        }
        // Míč přeletěl pravou stěnu -> bod pro hráče 1 (vlevo).
        else if (this.ball.x > SCREEN_W) {
            this.scoreLeft += 1;
            this.serveDir = 1;
            this.afterPoint();
        }
    }

    // Přidá míči svislý "spin" podle toho, kam na pálku dopadl.
    // Zásah u kraje pálky odráží prudčeji než zásah doprostřed.
    applyPaddleSpin(paddle) {
        const ballCenter = this.ball.y + BALL_SIZE / 2;
        const paddleCenter = paddle.y + PADDLE_H / 2;
        const offset = ballCenter - paddleCenter; // -PADDLE_H/2 .. +PADDLE_H/2
        // Namapuj offset na svislou rychlost -3..+3.
        const spin = Math.round((offset / (PADDLE_H / 2)) * 3);
        this.ballDY = spin;
        // Nedovol nulovou svislou rychlost, ať míč není nudně vodorovný.
        if (this.ballDY === 0) {
            this.ballDY = Math.random() < 0.5 ? -1 : 1;
        }
    }

    // Vyhodnotí konec výměny: buď výhra, nebo nové podání.
    afterPoint() {
        if (this.scoreLeft >= WIN_SCORE) {
            this.winner = 1;
            this.state = STATE_OVER;
        } else if (this.scoreRight >= WIN_SCORE) {
            this.winner = 2;
            this.state = STATE_OVER;
        } else {
            this.state = STATE_SERVE;
        }
        this.centerBall();
    }

    render() {
        // Pozadí (zároveň smaže minulý snímek).
        BT.clear(COLOR_BG);

        // Přerušovaná střední čára.
        const midX = Math.floor((SCREEN_W - 2) / 2);
        for (let y = 4; y < SCREEN_H; y += 12) {
            BT.drawRectFill(new Rect2i(midX, y, 2, 6), COLOR_FG);
        }

        // Pálky.
        BT.drawRectFill(this.leftPaddle, COLOR_FG);
        BT.drawRectFill(this.rightPaddle, COLOR_FG);

        // Míč.
        BT.drawRectFill(this.ball, COLOR_FG);

        // Skóre nahoře, po stranách od středu.
        const leftScore = `${this.scoreLeft}`;
        const rightScore = `${this.scoreRight}`;
        BT.systemPrint(new Vector2i(midX - 40, 8), COLOR_TEXT, leftScore);
        BT.systemPrint(new Vector2i(midX + 30, 8), COLOR_TEXT, rightScore);

        // Nápovědy podle stavu.
        if (this.state === STATE_SERVE) {
            this.printCentered(SCREEN_H - 24, 'MEZERNIK = PODANI');
        } else if (this.state === STATE_OVER) {
            const who = this.winner === 1 ? 'HRAC 1' : 'HRAC 2';
            this.printCentered(90, `${who} VYHRAL!`);
            this.printCentered(110, 'MEZERNIK = NOVA HRA');
        }
    }

    // Pomůcka: vytiskne text vodorovně vystředěný.
    printCentered(y, text) {
        const size = BT.systemPrintMeasure(text);
        const x = Math.floor((SCREEN_W - size.x) / 2);
        BT.systemPrint(new Vector2i(x, y), COLOR_TEXT, text);
    }
}

bootstrap(Game);
