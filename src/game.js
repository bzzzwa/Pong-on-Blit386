// Pong - a two-player Pong game for BLIT386.
//
// Two players on a single keyboard:
//   Player 1 (left paddle):  W = up, S = down
//   Player 2 (right paddle): Arrow Up / Arrow Down
//   Space = serve the ball (at the start and after each point)
//
// The ball is a small square; the paddles are rectangles that move up and
// down along the left and right walls. First to WIN_SCORE points wins.
//
// Every BLIT386 game is a single class with four methods:
//   configure() - once, sets the screen size and FPS
//   init()      - once at startup, sets up colors and the initial state
//   update()    - ~60x/s, reads input, moves things, resolves collisions and score
//   render()    - ~60x/s, draws the current state

import { bootstrap, BT, Color32, Rect2i, Vector2i } from 'blit386';

// --- Color slots (real colors are assigned in init()) ---------------------
// Slot 0 is always transparent, so we start at 1.
const COLOR_BG = 1; // background
const COLOR_FG = 2; // paddles, ball, center line
const COLOR_TEXT = 3; // score and messages

// --- Sizes and speeds (the fun knobs to tweak) ----------------------------
const SCREEN_W = 320;
const SCREEN_H = 240;

const PADDLE_W = 6; // paddle width
const PADDLE_H = 40; // paddle height
const PADDLE_SPEED = 3; // how many pixels the paddle moves per step
const PADDLE_MARGIN = 10; // paddle offset from the side wall

const BALL_SIZE = 6; // side of the ball square
const BALL_SPEED_X = 3; // horizontal ball speed
const BALL_START_SPEED_Y = 2; // vertical ball speed on serve

const WIN_SCORE = 11; // how many points it takes to win

// Game states
const STATE_SERVE = 'serve'; // waiting for a serve (Space)
const STATE_PLAY = 'play'; // the ball is in play
const STATE_OVER = 'over'; // someone has won

class Game {
    configure() {
        return {
            displaySize: new Vector2i(SCREEN_W, SCREEN_H),
            targetFPS: 60,
        };
    }

    async init() {
        // Color palette - retro black-and-white look.
        const palette = BT.paletteCreate(16);
        palette.set(COLOR_BG, new Color32(12, 14, 20)); // near black
        palette.set(COLOR_FG, new Color32(235, 240, 255)); // near white
        palette.set(COLOR_TEXT, new Color32(120, 200, 160)); // muted green
        BT.paletteSet(palette);

        // Left paddle (player 1) and right paddle (player 2), both centered vertically.
        const paddleY = Math.floor((SCREEN_H - PADDLE_H) / 2);
        this.leftPaddle = new Rect2i(PADDLE_MARGIN, paddleY, PADDLE_W, PADDLE_H);
        this.rightPaddle = new Rect2i(
            SCREEN_W - PADDLE_MARGIN - PADDLE_W,
            paddleY,
            PADDLE_W,
            PADDLE_H,
        );

        // The ball and its direction.
        this.ball = new Rect2i(0, 0, BALL_SIZE, BALL_SIZE);
        this.ballDX = 0;
        this.ballDY = 0;

        // Score.
        this.scoreLeft = 0;
        this.scoreRight = 0;

        // Who serves first (-1 = to the left, i.e. the ball flies toward player 1).
        this.serveDir = Math.random() < 0.5 ? -1 : 1;

        this.state = STATE_SERVE;
        this.winner = 0;

        this.centerBall();
        return true;
    }

    // Places the ball in the center and stops it (ready to serve).
    centerBall() {
        this.ball.x = Math.floor((SCREEN_W - BALL_SIZE) / 2);
        this.ball.y = Math.floor((SCREEN_H - BALL_SIZE) / 2);
        this.ballDX = 0;
        this.ballDY = 0;
    }

    // Launches the ball in the serveDir direction (-1 left, +1 right).
    serveBall() {
        this.ballDX = BALL_SPEED_X * this.serveDir;
        // Random vertical direction so it isn't the same every time.
        this.ballDY = Math.random() < 0.5 ? -BALL_START_SPEED_Y : BALL_START_SPEED_Y;
        this.state = STATE_PLAY;
    }

    // Moves a paddle by the given delta and keeps it on screen.
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
        // --- Paddle controls (active in every state, so players can warm up) ---
        // Player 1: W / S
        if (BT.isKeyDown('KeyW')) {
            this.movePaddle(this.leftPaddle, -PADDLE_SPEED);
        }
        if (BT.isKeyDown('KeyS')) {
            this.movePaddle(this.leftPaddle, PADDLE_SPEED);
        }
        // Player 2: Arrow Up / Arrow Down
        if (BT.isKeyDown('ArrowUp')) {
            this.movePaddle(this.rightPaddle, -PADDLE_SPEED);
        }
        if (BT.isKeyDown('ArrowDown')) {
            this.movePaddle(this.rightPaddle, PADDLE_SPEED);
        }

        // --- State logic ---
        if (this.state === STATE_SERVE) {
            // The ball stays centered until someone presses Space.
            if (BT.isKeyPressed('Space')) {
                this.serveBall();
            }
            return;
        }

        if (this.state === STATE_OVER) {
            // Space starts a fresh game from zero.
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

        // --- STATE_PLAY: move the ball ---
        this.ball.x += this.ballDX;
        this.ball.y += this.ballDY;

        // Bounce off the top and bottom walls.
        if (this.ball.y <= 0) {
            this.ball.y = 0;
            this.ballDY = Math.abs(this.ballDY);
        }
        const maxBallY = SCREEN_H - BALL_SIZE;
        if (this.ball.y >= maxBallY) {
            this.ball.y = maxBallY;
            this.ballDY = -Math.abs(this.ballDY);
        }

        // Bounce off the paddles. The ball must be heading toward the paddle,
        // otherwise it could get "stuck".
        if (this.ballDX < 0 && this.ball.isIntersecting(this.leftPaddle)) {
            this.ball.x = this.leftPaddle.x + PADDLE_W; // push the ball in front of the paddle
            this.ballDX = Math.abs(this.ballDX);
            this.applyPaddleSpin(this.leftPaddle);
        } else if (this.ballDX > 0 && this.ball.isIntersecting(this.rightPaddle)) {
            this.ball.x = this.rightPaddle.x - BALL_SIZE;
            this.ballDX = -Math.abs(this.ballDX);
            this.applyPaddleSpin(this.rightPaddle);
        }

        // Ball flew past the left wall -> point for player 2 (right).
        if (this.ball.x + BALL_SIZE < 0) {
            this.scoreRight += 1;
            this.serveDir = -1; // serve toward whoever conceded the point
            this.afterPoint();
        }
        // Ball flew past the right wall -> point for player 1 (left).
        else if (this.ball.x > SCREEN_W) {
            this.scoreLeft += 1;
            this.serveDir = 1;
            this.afterPoint();
        }
    }

    // Adds vertical "spin" to the ball based on where it hit the paddle.
    // A hit near the paddle edge bounces more sharply than a hit in the middle.
    applyPaddleSpin(paddle) {
        const ballCenter = this.ball.y + BALL_SIZE / 2;
        const paddleCenter = paddle.y + PADDLE_H / 2;
        const offset = ballCenter - paddleCenter; // -PADDLE_H/2 .. +PADDLE_H/2
        // Map the offset onto a vertical speed of -3..+3.
        const spin = Math.round((offset / (PADDLE_H / 2)) * 3);
        this.ballDY = spin;
        // Never allow zero vertical speed, so the ball isn't boringly horizontal.
        if (this.ballDY === 0) {
            this.ballDY = Math.random() < 0.5 ? -1 : 1;
        }
    }

    // Evaluates the end of a rally: either a win or a new serve.
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
        // Background (also erases the previous frame).
        BT.clear(COLOR_BG);

        // Dashed center line.
        const midX = Math.floor((SCREEN_W - 2) / 2);
        for (let y = 4; y < SCREEN_H; y += 12) {
            BT.drawRectFill(new Rect2i(midX, y, 2, 6), COLOR_FG);
        }

        // Paddles.
        BT.drawRectFill(this.leftPaddle, COLOR_FG);
        BT.drawRectFill(this.rightPaddle, COLOR_FG);

        // Ball.
        BT.drawRectFill(this.ball, COLOR_FG);

        // Score at the top, on either side of the center.
        const leftScore = `${this.scoreLeft}`;
        const rightScore = `${this.scoreRight}`;
        BT.systemPrint(new Vector2i(midX - 40, 8), COLOR_TEXT, leftScore);
        BT.systemPrint(new Vector2i(midX + 30, 8), COLOR_TEXT, rightScore);

        // State-dependent hints.
        if (this.state === STATE_SERVE) {
            this.printCentered(SCREEN_H - 24, 'SPACE = SERVE');
        } else if (this.state === STATE_OVER) {
            const who = this.winner === 1 ? 'PLAYER 1' : 'PLAYER 2';
            this.printCentered(90, `${who} WINS!`);
            this.printCentered(110, 'SPACE = NEW GAME');
        }
    }

    // Helper: prints text horizontally centered.
    printCentered(y, text) {
        const size = BT.systemPrintMeasure(text);
        const x = Math.floor((SCREEN_W - size.x) / 2);
        BT.systemPrint(new Vector2i(x, y), COLOR_TEXT, text);
    }
}

bootstrap(Game);
