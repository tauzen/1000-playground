// Game Constants (base resolution)
const BASE_WIDTH = 800;
const BASE_HEIGHT = 400;
let CANVAS_WIDTH = 800;
let CANVAS_HEIGHT = 400;
let scale = 1;
const TILE_SIZE = 32;
const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const JUMP_CUT_MULTIPLIER = 0.4;

// Speed settings
const START_SPEED = 2;
const MAX_SPEED = 8;
const SPEED_INCREMENT = 0.001;
let currentSpeed = START_SPEED;

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                 ('ontouchstart' in window) ||
                 (navigator.maxTouchPoints > 0);

// Touch state for visual feedback
let touchActive = false;

// Color Palette - mirrors CSS variables for use in canvas
const COLORS = {
    // Background colors
    bgDarkest: '#0f0f1a',
    bgDark: '#1a1a2e',
    bgMid: '#16213e',
    bgLight: '#1f4068',

    // Accent colors
    accentPrimary: '#e94560',
    accentSecondary: '#ff6b9d',
    accentTertiary: '#c34a7b',

    // Neon colors for ASCII art
    neonCyan: '#00fff5',
    neonPink: '#ff00ff',
    neonGreen: '#39ff14',
    neonYellow: '#ffff00',
    neonOrange: '#ff6600',

    // Text colors
    textPrimary: '#eaeaea',
    textSecondary: '#a0a0b0',
    textMuted: '#606080',

    // Game elements
    player: '#e94560',
    playerOutline: '#c34a7b',
    ground: '#2a2a4e',
    groundTop: '#4a4a7e',
    groundDark: '#1a1a3e',
    platform: '#3a3a6e',
    platformTop: '#6a6aae'
};

// Game State
let canvas, ctx;
let gameState = 'start';
let score = 0;
let distance = 0;

// Player
const player = {
    x: 150,
    y: 200,
    width: TILE_SIZE - 4,
    height: TILE_SIZE - 4,
    velY: 0,
    onGround: false,
    isJumping: false,
    jumpKeyHeld: false
};

// Starting chunk
const startingChunk = [
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG"
];

// Map chunks
const mapChunks = [
    [
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "....PPP.........",
        "................",
        "GGGGGGGG..GGGGGG",
        "GGGGGGGG..GGGGGG",
        "GGGGGGGG..GGGGGG"
    ],
    [
        "................",
        "................",
        "................",
        "................",
        "............PPP.",
        "................",
        "........PPP.....",
        "................",
        "....PPP.........",
        "GGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGG"
    ],
    [
        "................",
        "................",
        "................",
        "......PPP.......",
        "................",
        "..PPP......PPP..",
        "................",
        "................",
        "................",
        "GGG..GGGGGG..GGG",
        "GGG..GGGGGG..GGG",
        "GGG..GGGGGG..GGG"
    ],
    [
        "................",
        "................",
        "................",
        "................",
        "PPPPPP....PPPPPP",
        "................",
        "................",
        "................",
        "................",
        "GGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGG"
    ],
    [
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        ".....PP...PP....",
        "................",
        "................",
        "GGG...GGG...GGGG",
        "GGG...GGG...GGGG",
        "GGG...GGG...GGGG"
    ]
];

// World tiles
let worldTiles = [];
let scrollOffset = 0;
let nextChunkX = 0;
let chunksGenerated = 0;

// ASCII Art Background Elements
const ASCII_CITY = [
    "    |   |   _|_  |  _|_      |      ",
    "   _|_  |  |   | | |   |    _|_     ",
    "  |   | |__|   |_| |   |___|   |    ",
    " _|   |_|  |   | | |   |   |   |_   ",
    "|         ||   |   |   |   |     |  ",
    "|  []  [] ||[] |[] | []|[] | []  |  ",
    "|  []  [] ||[] |[] | []|[] | []  |  ",
    "|_[]__[]_||[]_|[]_|_[]|[]_|_[]__|  "
];

const ASCII_MOUNTAINS = [
    "                    /\\                      /\\      ",
    "        /\\         /  \\        /\\          /  \\     ",
    "       /  \\       /    \\      /  \\        /    \\    ",
    "      /    \\     /      \\    /    \\      /      \\   ",
    "     /      \\   /        \\  /      \\    /        \\  ",
    "    /        \\ /          \\/        \\  /          \\ ",
    "___/          V            \\          \\/            \\"
];

const ASCII_STARS = [
    " *    .  *       .    *      .   *    .     *   ",
    "   .       *  .    *    .  *      .    *   .    ",
    "  *   .  .      *     .      *  .    .    *     ",
    "    .    *   .     *    .  *     .  *   .    *  "
];

const ASCII_GRID = [
    "+---------+---------+---------+---------+",
    "|         |         |         |         |",
    "|         |         |         |         |",
    "+---------+---------+---------+---------+"
];

// Background layers
const background = {
    stars: [],
    cityBlocks: [],
    mountains: [],
    gridLines: []
};

// Character size for ASCII rendering
const CHAR_WIDTH = 8;
const CHAR_HEIGHT = 12;

function initBackground() {
    // Generate star positions
    for (let i = 0; i < 50; i++) {
        background.stars.push({
            x: Math.random() * BASE_WIDTH * 3,
            y: Math.random() * 100,
            char: Math.random() > 0.7 ? '*' : '.',
            color: Math.random() > 0.5 ? COLORS.neonCyan : COLORS.neonPink,
            twinkle: Math.random() * Math.PI * 2
        });
    }

    // Generate city blocks
    let cityX = 0;
    while (cityX < BASE_WIDTH * 3) {
        background.cityBlocks.push({
            x: cityX,
            height: 60 + Math.random() * 80,
            width: 40 + Math.random() * 60,
            windows: Math.floor(Math.random() * 4) + 2
        });
        cityX += 50 + Math.random() * 80;
    }

    // Generate mountain segments
    let mtnX = 0;
    while (mtnX < BASE_WIDTH * 3) {
        background.mountains.push({
            x: mtnX,
            height: 30 + Math.random() * 50,
            width: 80 + Math.random() * 120
        });
        mtnX += 60 + Math.random() * 100;
    }

    // Generate grid line positions
    for (let i = 0; i < 20; i++) {
        background.gridLines.push({
            y: 280 + i * 8,
            speed: 0.8 - (i * 0.03)
        });
    }
}

function drawASCIIText(text, x, y, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = `${CHAR_HEIGHT}px "Courier New", monospace`;
    ctx.fillText(text, x, y);
    ctx.restore();
}

function drawBackground() {
    // Dark gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, BASE_HEIGHT);
    gradient.addColorStop(0, COLORS.bgDarkest);
    gradient.addColorStop(0.4, COLORS.bgDark);
    gradient.addColorStop(0.7, COLORS.bgMid);
    gradient.addColorStop(1, COLORS.bgLight);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    // Draw ASCII stars
    drawASCIIStars();

    // Draw ASCII art layers
    drawASCIIMountains();
    drawASCIICity();
    drawASCIIGrid();
    drawDataStream();
}

function drawASCIIStars() {
    const time = Date.now() * 0.001;

    for (const star of background.stars) {
        let screenX = (star.x - scrollOffset * 0.05) % (BASE_WIDTH * 3);
        if (screenX < 0) screenX += BASE_WIDTH * 3;

        if (screenX < BASE_WIDTH + 20) {
            const twinkle = 0.4 + 0.6 * Math.sin(star.twinkle + time * 2);
            drawASCIIText(star.char, screenX, star.y, star.color, twinkle);
        }
    }

    // Draw ASCII star pattern overlay
    const starPatternY = 20;
    for (let i = 0; i < ASCII_STARS.length; i++) {
        const pattern = ASCII_STARS[i];
        let offsetX = (-scrollOffset * 0.03) % (pattern.length * CHAR_WIDTH);

        // Draw pattern twice for seamless scrolling
        for (let repeat = 0; repeat < 3; repeat++) {
            const x = offsetX + repeat * pattern.length * CHAR_WIDTH;
            if (x < BASE_WIDTH + 100 && x > -pattern.length * CHAR_WIDTH) {
                const alpha = 0.3 + 0.2 * Math.sin(time + i);
                drawASCIIText(pattern, x, starPatternY + i * CHAR_HEIGHT, COLORS.textMuted, alpha);
            }
        }
    }
}

function drawASCIIMountains() {
    const parallax = 0.15;

    // Draw ASCII mountain pattern
    for (let i = 0; i < ASCII_MOUNTAINS.length; i++) {
        const pattern = ASCII_MOUNTAINS[i];
        let offsetX = (-scrollOffset * parallax) % (pattern.length * CHAR_WIDTH);

        for (let repeat = 0; repeat < 4; repeat++) {
            const x = offsetX + repeat * pattern.length * CHAR_WIDTH;
            if (x < BASE_WIDTH + 100 && x > -pattern.length * CHAR_WIDTH) {
                const y = 140 + i * 10;
                const colorIndex = i / ASCII_MOUNTAINS.length;
                const color = colorIndex < 0.5 ? COLORS.bgLight : COLORS.neonCyan;
                drawASCIIText(pattern, x, y, color, 0.4 + colorIndex * 0.3);
            }
        }
    }

    // Draw procedural ASCII mountains
    for (const mtn of background.mountains) {
        const screenX = (mtn.x - scrollOffset * 0.2) % (BASE_WIDTH * 3);
        const wrappedX = screenX < -mtn.width ? screenX + BASE_WIDTH * 3 : screenX;

        if (wrappedX > -mtn.width && wrappedX < BASE_WIDTH + mtn.width) {
            drawASCIIMountain(wrappedX, 220, mtn.width, mtn.height);
        }
    }
}

function drawASCIIMountain(x, baseY, width, height) {
    const lines = Math.floor(height / 10);

    for (let i = 0; i < lines; i++) {
        const lineWidth = Math.floor((i + 1) * (width / lines) / CHAR_WIDTH);
        const offsetX = x + (width / 2) - (lineWidth * CHAR_WIDTH / 2);
        const y = baseY - height + i * 10;

        let line = '';
        for (let j = 0; j < lineWidth; j++) {
            if (j === 0) line += '/';
            else if (j === lineWidth - 1) line += '\\';
            else if (i === 0) line += '^';
            else line += Math.random() > 0.8 ? '.' : ' ';
        }

        const alpha = 0.3 + (i / lines) * 0.4;
        drawASCIIText(line, offsetX, y, COLORS.neonGreen, alpha);
    }
}

function drawASCIICity() {
    const parallax = 0.3;

    // Draw ASCII city pattern
    for (let i = 0; i < ASCII_CITY.length; i++) {
        const pattern = ASCII_CITY[i];
        let offsetX = (-scrollOffset * parallax) % (pattern.length * CHAR_WIDTH);

        for (let repeat = 0; repeat < 4; repeat++) {
            const x = offsetX + repeat * pattern.length * CHAR_WIDTH;
            if (x < BASE_WIDTH + 100 && x > -pattern.length * CHAR_WIDTH) {
                const y = 200 + i * 10;
                drawASCIIText(pattern, x, y, COLORS.neonPink, 0.6);
            }
        }
    }

    // Draw procedural city blocks
    for (const block of background.cityBlocks) {
        const screenX = (block.x - scrollOffset * 0.35) % (BASE_WIDTH * 3);
        const wrappedX = screenX < -block.width ? screenX + BASE_WIDTH * 3 : screenX;

        if (wrappedX > -block.width && wrappedX < BASE_WIDTH + block.width) {
            drawASCIICityBlock(wrappedX, 270 - block.height, block.width, block.height, block.windows);
        }
    }
}

function drawASCIICityBlock(x, y, width, height, windows) {
    const cols = Math.floor(width / CHAR_WIDTH);
    const rows = Math.floor(height / CHAR_HEIGHT);
    const time = Date.now() * 0.001;

    for (let row = 0; row < rows; row++) {
        let line = '';
        for (let col = 0; col < cols; col++) {
            if (col === 0 || col === cols - 1) {
                line += '|';
            } else if (row === 0) {
                line += '_';
            } else if (row === rows - 1) {
                line += '_';
            } else {
                // Windows
                const isWindowCol = col % 3 === 1;
                const isWindowRow = row % 2 === 1;
                if (isWindowCol && isWindowRow) {
                    // Flickering window
                    const flicker = Math.sin(time * 3 + col + row * 10) > 0;
                    line += flicker ? '#' : '.';
                } else {
                    line += ' ';
                }
            }
        }

        const color = row === 0 ? COLORS.neonCyan : COLORS.accentPrimary;
        drawASCIIText(line, x, y + row * CHAR_HEIGHT, color, 0.7);
    }
}

function drawASCIIGrid() {
    const time = Date.now() * 0.001;

    // Retro grid effect at bottom
    ctx.save();

    for (let i = 0; i < background.gridLines.length; i++) {
        const line = background.gridLines[i];
        const y = line.y;
        const speed = line.speed;

        // Horizontal line
        let gridLine = '';
        for (let x = 0; x < BASE_WIDTH / CHAR_WIDTH + 5; x++) {
            const offset = Math.floor(scrollOffset * speed / CHAR_WIDTH);
            if ((x + offset) % 10 === 0) {
                gridLine += '+';
            } else {
                gridLine += '-';
            }
        }

        const alpha = 0.15 + (i / background.gridLines.length) * 0.25;
        const offsetX = -(scrollOffset * speed) % CHAR_WIDTH;
        drawASCIIText(gridLine, offsetX, y, COLORS.neonCyan, alpha);
    }

    // Vertical grid lines
    const verticalSpacing = 80;
    for (let vx = 0; vx < BASE_WIDTH + verticalSpacing; vx += verticalSpacing) {
        const screenX = vx - (scrollOffset * 0.8) % verticalSpacing;
        const perspectiveScale = 1 + (screenX - BASE_WIDTH / 2) * 0.001;

        for (let vy = 280; vy < BASE_HEIGHT; vy += 8) {
            const alpha = 0.1 + ((vy - 280) / (BASE_HEIGHT - 280)) * 0.3;
            drawASCIIText('|', screenX, vy, COLORS.neonPink, alpha * perspectiveScale);
        }
    }

    ctx.restore();
}

function drawDataStream() {
    const time = Date.now() * 0.001;
    const chars = '01';

    // Binary data streams on the sides
    for (let stream = 0; stream < 3; stream++) {
        const baseX = stream * 350 + 50;
        const screenX = baseX - (scrollOffset * 0.1) % 50;

        for (let i = 0; i < 10; i++) {
            const y = 50 + i * 15 + Math.sin(time * 2 + stream) * 5;
            const char = chars[Math.floor((time * 10 + i + stream) % 2)];
            const alpha = 0.1 + Math.sin(time * 3 + i * 0.5) * 0.1;

            if (screenX > 0 && screenX < BASE_WIDTH) {
                drawASCIIText(char, screenX, y, COLORS.neonGreen, alpha);
            }
        }
    }
}

// Particles (ASCII style)
const particles = [];
const NUM_PARTICLES = 30;

function initParticles() {
    for (let i = 0; i < NUM_PARTICLES; i++) {
        particles.push({
            x: Math.random() * BASE_WIDTH,
            y: Math.random() * BASE_HEIGHT,
            char: ['*', '.', '+', 'o', '~'][Math.floor(Math.random() * 5)],
            speed: Math.random() * 1 + 0.3,
            drift: Math.random() * 0.5 - 0.25,
            color: [COLORS.neonCyan, COLORS.neonPink, COLORS.neonGreen][Math.floor(Math.random() * 3)]
        });
    }
}

function updateParticles() {
    for (const p of particles) {
        p.y += p.speed;
        p.x += p.drift - currentSpeed * 0.2;

        if (p.y > BASE_HEIGHT) {
            p.y = -10;
            p.x = Math.random() * BASE_WIDTH;
        }
        if (p.x < 0) p.x = BASE_WIDTH;
        if (p.x > BASE_WIDTH) p.x = 0;
    }
}

function drawParticles() {
    for (const p of particles) {
        drawASCIIText(p.char, Math.floor(p.x), Math.floor(p.y), p.color, 0.6);
    }
}

// Canvas resize
function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}

function getViewportSize() {
    if (window.visualViewport) {
        return {
            width: window.visualViewport.width,
            height: window.visualViewport.height
        };
    }
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    const viewport = getViewportSize();
    const isLandscape = viewport.width > viewport.height;
    const isMobileLandscape = isMobile && isLandscape;
    const inFullscreen = isFullscreen();

    let maxWidth, maxHeight;

    if (inFullscreen) {
        maxWidth = viewport.width;
        maxHeight = viewport.height;
    } else if (isMobileLandscape) {
        maxWidth = viewport.width;
        maxHeight = viewport.height;
    } else if (isMobile) {
        maxWidth = viewport.width - 10;
        maxHeight = viewport.height - 100;
    } else {
        maxWidth = viewport.width - 40;
        maxHeight = viewport.height - 60;
    }

    const scaleX = maxWidth / BASE_WIDTH;
    const scaleY = maxHeight / BASE_HEIGHT;

    if (inFullscreen || isMobileLandscape) {
        scale = Math.min(scaleX, scaleY);
    } else {
        scale = Math.min(scaleX, scaleY, 2);
    }

    if (scale < 0.4) scale = 0.4;

    CANVAS_WIDTH = Math.floor(BASE_WIDTH * scale);
    CANVAS_HEIGHT = Math.floor(BASE_HEIGHT * scale);

    canvas.width = BASE_WIDTH;
    canvas.height = BASE_HEIGHT;
    canvas.style.width = CANVAS_WIDTH + 'px';
    canvas.style.height = CANVAS_HEIGHT + 'px';

    container.style.width = CANVAS_WIDTH + 'px';

    ctx.imageSmoothingEnabled = false;
}

// Initialize
function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');

    resizeCanvas();
    ctx.imageSmoothingEnabled = false;

    generateInitialWorld();
    initBackground();
    initParticles();

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('click', handleClick);

    window.addEventListener('resize', debounce(handleResize, 100));
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 100);
    });

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', debounce(handleResize, 100));
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', handleJumpBtnStart, { passive: false });
        jumpBtn.addEventListener('touchend', handleJumpBtnEnd, { passive: false });
        jumpBtn.addEventListener('mousedown', handleJumpBtnStart);
        jumpBtn.addEventListener('mouseup', handleJumpBtnEnd);
        jumpBtn.addEventListener('mouseleave', handleJumpBtnEnd);
    }

    handleResize();
    requestAnimationFrame(gameLoop);
}

function handleResize() {
    resizeCanvas();
    updateMobileControls();
    checkOrientation();
}

function checkOrientation() {
    const orientationOverlay = document.getElementById('orientation-overlay');
    if (orientationOverlay && isMobile) {
        const isPortrait = window.innerHeight > window.innerWidth * 1.2;
        orientationOverlay.style.display = isPortrait ? 'flex' : 'none';
    }
}

function handleJumpBtnStart(e) {
    e.preventDefault();
    e.stopPropagation();
    touchActive = true;
    player.jumpKeyHeld = true;

    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) jumpBtn.classList.add('active');

    const container = document.getElementById('game-container');
    if (container) container.classList.add('touch-active');

    handleInput();
}

function handleJumpBtnEnd(e) {
    e.preventDefault();
    e.stopPropagation();
    touchActive = false;
    player.jumpKeyHeld = false;

    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) jumpBtn.classList.remove('active');

    const container = document.getElementById('game-container');
    if (container) container.classList.remove('touch-active');

    if (player.isJumping && player.velY < 0) {
        player.velY *= JUMP_CUT_MULTIPLIER;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function updateMobileControls() {
    const mobileControls = document.getElementById('mobile-controls');
    const isLandscape = window.innerWidth > window.innerHeight;

    if (mobileControls) {
        mobileControls.style.display = (isMobile && !isLandscape) ? 'flex' : 'none';
    }
}

function generateInitialWorld() {
    worldTiles = [];
    nextChunkX = 0;
    chunksGenerated = 0;

    while (nextChunkX < BASE_WIDTH + TILE_SIZE * 16) {
        generateNextChunk();
    }
}

function generateNextChunk() {
    let chunk;
    let chunkWidth;

    if (chunksGenerated === 0) {
        chunk = startingChunk;
        chunkWidth = 48;
    } else {
        const chunkIndex = Math.floor(Math.random() * mapChunks.length);
        chunk = mapChunks[chunkIndex];
        chunkWidth = 16;
    }

    for (let row = 0; row < chunk.length; row++) {
        for (let col = 0; col < chunk[row].length; col++) {
            const char = chunk[row][col];
            if (char === 'G' || char === 'P') {
                worldTiles.push({
                    x: nextChunkX + col * TILE_SIZE,
                    y: row * TILE_SIZE,
                    type: char === 'G' ? 'ground' : 'platform'
                });
            }
        }
    }

    nextChunkX += chunkWidth * TILE_SIZE;
    chunksGenerated++;
}

function handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        player.jumpKeyHeld = true;

        if (gameState === 'start') {
            startGame();
        } else if (gameState === 'gameover') {
            restartGame();
        } else if (gameState === 'playing') {
            jump();
        }
    }
}

function handleKeyUp(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        player.jumpKeyHeld = false;

        if (player.isJumping && player.velY < 0) {
            player.velY *= JUMP_CUT_MULTIPLIER;
        }
    }
}

function handleTouchStart(e) {
    if (e.target.id === 'jump-btn') return;

    e.preventDefault();
    touchActive = true;
    player.jumpKeyHeld = true;

    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) jumpBtn.classList.add('active');

    const container = document.getElementById('game-container');
    if (container) container.classList.add('touch-active');

    handleInput();
}

function handleTouchEnd(e) {
    if (e.target.id === 'jump-btn') return;

    e.preventDefault();
    touchActive = false;
    player.jumpKeyHeld = false;

    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) jumpBtn.classList.remove('active');

    const container = document.getElementById('game-container');
    if (container) container.classList.remove('touch-active');

    if (player.isJumping && player.velY < 0) {
        player.velY *= JUMP_CUT_MULTIPLIER;
    }
}

function handleClick(e) {
    player.jumpKeyHeld = true;
    handleInput();
    setTimeout(() => { player.jumpKeyHeld = false; }, 150);
}

function handleInput() {
    if (gameState === 'start') {
        startGame();
    } else if (gameState === 'gameover') {
        restartGame();
    } else if (gameState === 'playing') {
        jump();
    }
}

function requestFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

function handleFullscreenChange() {
    setTimeout(() => {
        handleResize();
    }, 100);
}

function startGame() {
    gameState = 'playing';
    document.getElementById('start-screen').classList.add('hidden');

    if (isMobile) {
        requestFullscreen();
    }
}

function restartGame() {
    gameState = 'playing';
    score = 0;
    distance = 0;
    scrollOffset = 0;
    currentSpeed = START_SPEED;
    player.x = 150;
    player.y = 200;
    player.velY = 0;
    player.onGround = false;
    player.isJumping = false;
    player.jumpKeyHeld = false;

    generateInitialWorld();

    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('score-value').textContent = '0';
}

function jump() {
    if (player.onGround && !player.isJumping) {
        player.velY = JUMP_FORCE;
        player.onGround = false;
        player.isJumping = true;
    }
}

function update() {
    if (gameState !== 'playing') return;

    player.velY += GRAVITY;
    if (player.velY > 15) player.velY = 15;
    player.y += player.velY;

    if (currentSpeed < MAX_SPEED) {
        currentSpeed += SPEED_INCREMENT;
    }

    scrollOffset += currentSpeed;
    distance += currentSpeed;

    score = Math.floor(distance / 10);
    document.getElementById('score-value').textContent = score;

    player.onGround = false;

    for (let i = worldTiles.length - 1; i >= 0; i--) {
        const tile = worldTiles[i];
        const tileScreenX = tile.x - scrollOffset;

        if (tileScreenX < -TILE_SIZE * 2) {
            worldTiles.splice(i, 1);
            continue;
        }

        if (checkCollision(player, {
            x: tileScreenX,
            y: tile.y,
            width: TILE_SIZE,
            height: TILE_SIZE
        })) {
            if (player.velY > 0 && player.y + player.height - player.velY <= tile.y + 5) {
                player.y = tile.y - player.height;
                player.velY = 0;
                player.onGround = true;
                player.isJumping = false;
            }
            else if (player.velY < 0 && player.y - player.velY >= tile.y + TILE_SIZE - 5) {
                player.y = tile.y + TILE_SIZE;
                player.velY = 0;
            }
            else if (player.velY >= 0 && player.y + player.height > tile.y + 8) {
                gameOver();
                return;
            }
        }
    }

    while (nextChunkX - scrollOffset < BASE_WIDTH + TILE_SIZE * 16) {
        generateNextChunk();
    }

    if (player.y > BASE_HEIGHT) {
        gameOver();
    }

    if (player.x < 50) {
        gameOver();
    }

    updateParticles();
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function gameOver() {
    gameState = 'gameover';
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
}

function draw() {
    // Draw ASCII art background
    drawBackground();

    // Draw particles
    drawParticles();

    // Draw tiles with ASCII style
    for (const tile of worldTiles) {
        const screenX = tile.x - scrollOffset;

        if (screenX < -TILE_SIZE || screenX > BASE_WIDTH) continue;

        if (tile.type === 'ground') {
            // Ground block - ASCII style
            ctx.fillStyle = COLORS.ground;
            ctx.fillRect(screenX, tile.y, TILE_SIZE, TILE_SIZE);

            // Top edge
            ctx.fillStyle = COLORS.groundTop;
            ctx.fillRect(screenX, tile.y, TILE_SIZE, 6);

            // Bottom edge
            ctx.fillStyle = COLORS.groundDark;
            ctx.fillRect(screenX, tile.y + TILE_SIZE - 4, TILE_SIZE, 4);

            // ASCII pattern on block
            drawASCIIText('[]', screenX + 8, tile.y + 20, COLORS.textMuted, 0.3);
        } else if (tile.type === 'platform') {
            // Platform block
            ctx.fillStyle = COLORS.platform;
            ctx.fillRect(screenX, tile.y, TILE_SIZE, TILE_SIZE);

            // Top highlight
            ctx.fillStyle = COLORS.platformTop;
            ctx.fillRect(screenX, tile.y, TILE_SIZE, 6);

            // ASCII pattern
            drawASCIIText('==', screenX + 8, tile.y + 20, COLORS.neonCyan, 0.4);
        }
    }

    // Draw player
    const px = player.x;
    const py = player.y;
    const pw = player.width;
    const ph = player.height;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(px + 4, py + ph + 2, pw, 4);

    // Main body
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(px, py, pw, ph);

    // Outline
    ctx.strokeStyle = COLORS.playerOutline;
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    // Eyes
    ctx.fillStyle = COLORS.textPrimary;
    ctx.fillRect(px + pw - 12, py + 8, 6, 6);
    ctx.fillRect(px + pw - 20, py + 8, 6, 6);

    // Pupils
    ctx.fillStyle = COLORS.bgDarkest;
    ctx.fillRect(px + pw - 8, py + 10, 3, 3);
    ctx.fillRect(px + pw - 16, py + 10, 3, 3);

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(px + 2, py + 2, pw - 4, 4);

    // ASCII decoration on player
    drawASCIIText('@', px + 4, py + ph - 6, COLORS.neonCyan, 0.5);

    // Draw speed meter
    drawSpeedMeter();
}

function drawSpeedMeter() {
    const meterX = BASE_WIDTH - 120;
    const meterY = 16;
    const meterWidth = 100;
    const meterHeight = 16;

    // Speed label (ASCII style)
    ctx.fillStyle = COLORS.accentPrimary;
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('SPD>', meterX - 8, meterY + 12);

    // Meter background
    ctx.fillStyle = COLORS.bgDarkest;
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

    // Meter border
    ctx.strokeStyle = COLORS.accentPrimary;
    ctx.lineWidth = 2;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

    // Speed fill
    const speedPercent = (currentSpeed - START_SPEED) / (MAX_SPEED - START_SPEED);
    const fillWidth = Math.max(0, Math.min(1, speedPercent)) * (meterWidth - 4);

    // Color based on speed
    let fillColor;
    if (speedPercent < 0.5) {
        fillColor = COLORS.neonGreen;
    } else if (speedPercent < 0.8) {
        fillColor = COLORS.neonYellow;
    } else {
        fillColor = COLORS.accentPrimary;
    }

    ctx.fillStyle = fillColor;
    ctx.fillRect(meterX + 2, meterY + 2, fillWidth, meterHeight - 4);

    // ASCII fill pattern
    const fillChars = Math.floor(fillWidth / 8);
    let fillText = '';
    for (let i = 0; i < fillChars; i++) {
        fillText += '|';
    }
    drawASCIIText(fillText, meterX + 4, meterY + 12, COLORS.bgDarkest, 0.5);

    // Speed value
    ctx.fillStyle = COLORS.textPrimary;
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(currentSpeed.toFixed(1), meterX + meterWidth / 2, meterY + 12);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

window.addEventListener('load', init);
