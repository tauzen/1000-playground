// Game Constants (base resolution)
const BASE_WIDTH = 800;
const BASE_HEIGHT = 400;
let CANVAS_WIDTH = 800;
let CANVAS_HEIGHT = 400;
let scale = 1;
const TILE_SIZE = 32;
const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const JUMP_CUT_MULTIPLIER = 0.4; // Velocity multiplier when releasing jump early

// Speed settings
const START_SPEED = 2;
const MAX_SPEED = 8;
const SPEED_INCREMENT = 0.001; // Speed increase per frame
let currentSpeed = START_SPEED;

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                 ('ontouchstart' in window) ||
                 (navigator.maxTouchPoints > 0);

// Touch state for visual feedback
let touchActive = false;

// Colors - arctic palette
const COLORS = {
    sky: '#0c1929',
    player: '#ff6b6b',
    playerOutline: '#cc4444',
    ground: '#3a5f8a',
    groundTop: '#ffffff',
    groundDark: '#1e3a5c',
    platform: '#4a7faa',
    platformTop: '#c8e8ff',
    coin: '#ffd700',
    coinShine: '#ffec8b'
};

// Game State
let canvas, ctx;
let gameState = 'start'; // 'start', 'playing', 'gameover'
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
    isJumping: false,      // Currently in a jump
    jumpKeyHeld: false     // Jump key is being held down
};

// Starting chunk - extra long flat platform for warmup (48 tiles = 1536px)
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

// Map chunks that repeat
const mapChunks = [
    // Chunk 0 - flat with gap
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
    // Chunk 1 - stairs up
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
    // Chunk 2 - platforms
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
    // Chunk 3 - low ceiling
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
    // Chunk 4 - pit jumps
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

// Active tiles in the world
let worldTiles = [];
let scrollOffset = 0;
let nextChunkX = 0;
let chunksGenerated = 0;

// Background layers for arctic landscape
const background = {
    farMountains: [],
    nearMountains: [],
    clouds: [],
    stars: []
};

function initBackground() {
    // Generate stars
    for (let i = 0; i < 30; i++) {
        background.stars.push({
            x: Math.random() * BASE_WIDTH * 3,
            y: Math.random() * 120,
            size: Math.random() * 2 + 1,
            twinkle: Math.random() * Math.PI
        });
    }

    // Generate far mountains (slower parallax)
    let farX = 0;
    while (farX < BASE_WIDTH * 3) {
        const width = 150 + Math.random() * 200;
        const height = 80 + Math.random() * 100;
        background.farMountains.push({
            x: farX,
            width: width,
            height: height,
            peaks: Math.floor(Math.random() * 2) + 1
        });
        farX += width * 0.7;
    }

    // Generate near mountains (faster parallax)
    let nearX = 0;
    while (nearX < BASE_WIDTH * 3) {
        const width = 100 + Math.random() * 150;
        const height = 60 + Math.random() * 80;
        background.nearMountains.push({
            x: nearX,
            width: width,
            height: height,
            peaks: Math.floor(Math.random() * 2) + 1
        });
        nearX += width * 0.6;
    }

    // Generate clouds
    for (let i = 0; i < 8; i++) {
        background.clouds.push({
            x: Math.random() * BASE_WIDTH * 2,
            y: 20 + Math.random() * 80,
            width: 60 + Math.random() * 80,
            height: 20 + Math.random() * 20,
            speed: 0.1 + Math.random() * 0.2
        });
    }
}

function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, BASE_HEIGHT);
    gradient.addColorStop(0, '#0a0f1a');
    gradient.addColorStop(0.3, '#0c1929');
    gradient.addColorStop(0.7, '#1a3a5c');
    gradient.addColorStop(1, '#2a5a7c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    // Draw stars with twinkle
    for (const star of background.stars) {
        let screenX = (star.x - scrollOffset * 0.02) % (BASE_WIDTH * 3);
        if (screenX < 0) screenX += BASE_WIDTH * 3;
        if (screenX < BASE_WIDTH + 10) {
            const alpha = 0.5 + 0.5 * Math.sin(star.twinkle + scrollOffset * 0.01);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(screenX, star.y, star.size, star.size);
        }
    }

    // Aurora borealis effect
    drawAurora();

    // Draw far mountains (slowest parallax - 0.1)
    const farParallax = 0.1;
    for (const mountain of background.farMountains) {
        const screenX = mountain.x - scrollOffset * farParallax;
        // Wrap around for infinite scrolling
        let wrappedX = screenX % (BASE_WIDTH * 3);
        if (wrappedX < -mountain.width) wrappedX += BASE_WIDTH * 3;
        if (wrappedX > -mountain.width && wrappedX < BASE_WIDTH + mountain.width) {
            drawMountain(wrappedX, 200, mountain.width, mountain.height, '#1a3050', '#2a4060');
        }
    }

    // Draw near mountains (medium parallax - 0.25)
    const nearParallax = 0.25;
    for (const mountain of background.nearMountains) {
        const screenX = mountain.x - scrollOffset * nearParallax;
        // Wrap around for infinite scrolling
        let wrappedX = screenX % (BASE_WIDTH * 3);
        if (wrappedX < -mountain.width) wrappedX += BASE_WIDTH * 3;
        if (wrappedX > -mountain.width && wrappedX < BASE_WIDTH + mountain.width) {
            drawMountain(wrappedX, 220, mountain.width, mountain.height, '#2a4a6a', '#3a5a7a');
        }
    }

    // Draw frozen ocean/ice
    drawFrozenOcean();

    // Draw clouds (slow drift)
    ctx.fillStyle = 'rgba(200, 220, 240, 0.3)';
    for (const cloud of background.clouds) {
        const screenX = (cloud.x - scrollOffset * 0.15) % (BASE_WIDTH * 2);
        const wrappedX = screenX < -cloud.width ? screenX + BASE_WIDTH * 2 : screenX;
        if (wrappedX > -cloud.width && wrappedX < BASE_WIDTH + cloud.width) {
            drawCloud(wrappedX, cloud.y, cloud.width, cloud.height);
        }
    }
}

function drawMountain(x, baseY, width, height, colorDark, colorLight) {
    // Main mountain body
    ctx.fillStyle = colorDark;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x + width * 0.5, baseY - height);
    ctx.lineTo(x + width, baseY);
    ctx.closePath();
    ctx.fill();

    // Snow cap
    ctx.fillStyle = '#e8f0f8';
    ctx.beginPath();
    ctx.moveTo(x + width * 0.35, baseY - height * 0.6);
    ctx.lineTo(x + width * 0.5, baseY - height);
    ctx.lineTo(x + width * 0.65, baseY - height * 0.6);
    ctx.closePath();
    ctx.fill();

    // Light side highlight
    ctx.fillStyle = colorLight;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.5, baseY - height);
    ctx.lineTo(x + width * 0.75, baseY - height * 0.3);
    ctx.lineTo(x + width, baseY);
    ctx.lineTo(x + width * 0.5, baseY);
    ctx.closePath();
    ctx.fill();
}

function drawCloud(x, y, width, height) {
    ctx.fillStyle = 'rgba(200, 220, 240, 0.4)';
    // Pixelated cloud shape
    const blockSize = 8;
    const pattern = [
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0]
    ];
    const scaleX = width / (pattern[0].length * blockSize);
    const scaleY = height / (pattern.length * blockSize);

    for (let row = 0; row < pattern.length; row++) {
        for (let col = 0; col < pattern[row].length; col++) {
            if (pattern[row][col]) {
                ctx.fillRect(
                    x + col * blockSize * scaleX,
                    y + row * blockSize * scaleY,
                    blockSize * scaleX,
                    blockSize * scaleY
                );
            }
        }
    }
}

function drawAurora() {
    // Northern lights effect
    const time = scrollOffset * 0.005;
    ctx.globalAlpha = 0.15;

    for (let i = 0; i < 3; i++) {
        const gradient = ctx.createLinearGradient(0, 30 + i * 20, 0, 100 + i * 30);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, i % 2 === 0 ? '#00ff88' : '#00aaff');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 60 + i * 15);

        for (let x = 0; x <= BASE_WIDTH; x += 20) {
            const wave = Math.sin((x + scrollOffset * 0.5 + i * 100) * 0.01) * 20;
            const wave2 = Math.sin((x + scrollOffset * 0.3 + i * 50) * 0.02) * 10;
            ctx.lineTo(x, 60 + i * 15 + wave + wave2);
        }

        ctx.lineTo(BASE_WIDTH, 150);
        ctx.lineTo(0, 150);
        ctx.closePath();
        ctx.fill();
    }

    ctx.globalAlpha = 1;
}

function drawFrozenOcean() {
    // Ocean base
    const oceanY = 280;
    const gradient = ctx.createLinearGradient(0, oceanY, 0, BASE_HEIGHT);
    gradient.addColorStop(0, '#1a4a6a');
    gradient.addColorStop(0.5, '#0a3050');
    gradient.addColorStop(1, '#082840');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, oceanY, BASE_WIDTH, BASE_HEIGHT - oceanY);

    // Ice floes on water
    ctx.fillStyle = '#a0d0e8';
    for (let i = 0; i < 5; i++) {
        const floeX = ((i * 200 + 50) - scrollOffset * 0.4) % (BASE_WIDTH + 200) - 100;
        const floeY = oceanY + 5 + Math.sin(scrollOffset * 0.02 + i) * 3;
        const floeWidth = 40 + (i % 3) * 20;

        ctx.fillRect(floeX, floeY, floeWidth, 6);
        ctx.fillStyle = '#c8e8f8';
        ctx.fillRect(floeX + 2, floeY, floeWidth - 4, 2);
        ctx.fillStyle = '#a0d0e8';
    }

    // Water reflection lines
    ctx.fillStyle = 'rgba(100, 180, 220, 0.2)';
    for (let i = 0; i < 8; i++) {
        const lineX = ((i * 120) - scrollOffset * 0.5) % (BASE_WIDTH + 100) - 50;
        const lineY = oceanY + 20 + i * 10;
        ctx.fillRect(lineX, lineY, 30 + i * 5, 2);
    }
}

// Snowflakes for arctic atmosphere
const snowflakes = [];
const NUM_SNOWFLAKES = 50;

function initSnowflakes() {
    for (let i = 0; i < NUM_SNOWFLAKES; i++) {
        snowflakes.push({
            x: Math.random() * BASE_WIDTH,
            y: Math.random() * BASE_HEIGHT,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 1 + 0.5,
            drift: Math.random() * 0.5 - 0.25
        });
    }
}

function updateSnowflakes() {
    for (const flake of snowflakes) {
        flake.y += flake.speed;
        flake.x += flake.drift - currentSpeed * 0.3;

        if (flake.y > BASE_HEIGHT) {
            flake.y = -5;
            flake.x = Math.random() * BASE_WIDTH;
        }
        if (flake.x < 0) flake.x = BASE_WIDTH;
        if (flake.x > BASE_WIDTH) flake.x = 0;
    }
}

function drawSnowflakes() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (const flake of snowflakes) {
        ctx.fillRect(Math.floor(flake.x), Math.floor(flake.y), flake.size, flake.size);
    }
}

// Resize canvas to fit screen
function resizeCanvas() {
    const container = document.getElementById('game-container');
    const maxWidth = window.innerWidth - 20; // 10px padding on each side
    const maxHeight = window.innerHeight - 100; // Space for controls on mobile

    // Calculate scale to fit while maintaining aspect ratio
    const scaleX = maxWidth / BASE_WIDTH;
    const scaleY = maxHeight / BASE_HEIGHT;
    scale = Math.min(scaleX, scaleY, 1.5); // Cap at 1.5x for large screens

    // For very small screens, ensure minimum playable size
    if (scale < 0.4) scale = 0.4;

    CANVAS_WIDTH = Math.floor(BASE_WIDTH * scale);
    CANVAS_HEIGHT = Math.floor(BASE_HEIGHT * scale);

    canvas.width = BASE_WIDTH;
    canvas.height = BASE_HEIGHT;
    canvas.style.width = CANVAS_WIDTH + 'px';
    canvas.style.height = CANVAS_HEIGHT + 'px';

    // Update container size
    container.style.width = CANVAS_WIDTH + 'px';

    // Disable image smoothing for pixel art (needs to be reset after resize)
    ctx.imageSmoothingEnabled = false;
}

// Initialize
function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');

    // Initial sizing
    resizeCanvas();

    // Disable image smoothing for pixel art
    ctx.imageSmoothingEnabled = false;

    // Generate initial chunks
    generateInitialWorld();

    // Initialize background
    initBackground();

    // Initialize snowflakes
    initSnowflakes();

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Touch events on the whole document for mobile
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('click', handleClick);

    // Handle resize events
    window.addEventListener('resize', debounce(handleResize, 100));
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 100);
    });

    // Mobile jump button
    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', handleJumpBtnStart, { passive: false });
        jumpBtn.addEventListener('touchend', handleJumpBtnEnd, { passive: false });
        jumpBtn.addEventListener('mousedown', handleJumpBtnStart);
        jumpBtn.addEventListener('mouseup', handleJumpBtnEnd);
        jumpBtn.addEventListener('mouseleave', handleJumpBtnEnd);
    }

    // Show/hide mobile controls and check orientation
    handleResize();

    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Handle resize and orientation
function handleResize() {
    resizeCanvas();
    updateMobileControls();
    checkOrientation();
}

// Check orientation and show overlay if portrait on mobile
function checkOrientation() {
    const orientationOverlay = document.getElementById('orientation-overlay');
    if (orientationOverlay && isMobile) {
        const isPortrait = window.innerHeight > window.innerWidth * 1.2;
        orientationOverlay.style.display = isPortrait ? 'flex' : 'none';
    }
}

// Jump button handlers
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

    // Cut jump short if released while rising
    if (player.isJumping && player.velY < 0) {
        player.velY *= JUMP_CUT_MULTIPLIER;
    }
}

// Debounce helper for resize events
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

// Update visibility of mobile controls
function updateMobileControls() {
    const mobileControls = document.getElementById('mobile-controls');
    const orientationOverlay = document.getElementById('orientation-overlay');

    if (mobileControls) {
        mobileControls.style.display = isMobile ? 'flex' : 'none';
    }

    // Check orientation on mobile
    if (orientationOverlay && isMobile) {
        const isPortrait = window.innerHeight > window.innerWidth;
        orientationOverlay.style.display = isPortrait ? 'flex' : 'none';
    }
}

function generateInitialWorld() {
    worldTiles = [];
    nextChunkX = 0;
    chunksGenerated = 0;

    // Generate enough chunks to fill screen plus buffer
    while (nextChunkX < BASE_WIDTH + TILE_SIZE * 16) {
        generateNextChunk();
    }
}

function generateNextChunk() {
    let chunk;
    let chunkWidth;

    // First chunk is the long starting platform
    if (chunksGenerated === 0) {
        chunk = startingChunk;
        chunkWidth = 48; // Starting chunk is 48 tiles wide
    } else {
        // Pick a random chunk from the regular ones
        const chunkIndex = Math.floor(Math.random() * mapChunks.length);
        chunk = mapChunks[chunkIndex];
        chunkWidth = 16; // Regular chunks are 16 tiles wide
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

        // Cut jump short if released while rising
        if (player.isJumping && player.velY < 0) {
            player.velY *= JUMP_CUT_MULTIPLIER;
        }
    }
}

function handleTouchStart(e) {
    // Don't handle if touch is on the jump button (it has its own handler)
    if (e.target.id === 'jump-btn') return;

    e.preventDefault();
    touchActive = true;
    player.jumpKeyHeld = true;

    // Update visual states
    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) jumpBtn.classList.add('active');

    const container = document.getElementById('game-container');
    if (container) container.classList.add('touch-active');

    handleInput();
}

function handleTouchEnd(e) {
    // Don't handle if touch is on the jump button (it has its own handler)
    if (e.target.id === 'jump-btn') return;

    e.preventDefault();
    touchActive = false;
    player.jumpKeyHeld = false;

    // Update visual states
    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) jumpBtn.classList.remove('active');

    const container = document.getElementById('game-container');
    if (container) container.classList.remove('touch-active');

    // Cut jump short if released while rising
    if (player.isJumping && player.velY < 0) {
        player.velY *= JUMP_CUT_MULTIPLIER;
    }
}

function handleClick(e) {
    // Click is instant, so just do a full jump
    player.jumpKeyHeld = true;
    handleInput();
    // Small delay then release for full jump on click
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

function startGame() {
    gameState = 'playing';
    document.getElementById('start-screen').classList.add('hidden');
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

    // Apply gravity
    player.velY += GRAVITY;

    // Cap fall speed
    if (player.velY > 15) player.velY = 15;

    // Move player vertically
    player.y += player.velY;

    // Gradually increase speed
    if (currentSpeed < MAX_SPEED) {
        currentSpeed += SPEED_INCREMENT;
    }

    // Scroll the world
    scrollOffset += currentSpeed;
    distance += currentSpeed;

    // Update score based on distance
    score = Math.floor(distance / 10);
    document.getElementById('score-value').textContent = score;

    // Update tile positions and check for collision
    player.onGround = false;

    for (let i = worldTiles.length - 1; i >= 0; i--) {
        const tile = worldTiles[i];
        const tileScreenX = tile.x - scrollOffset;

        // Remove tiles that are off screen to the left
        if (tileScreenX < -TILE_SIZE * 2) {
            worldTiles.splice(i, 1);
            continue;
        }

        // Check collision with player
        if (checkCollision(player, {
            x: tileScreenX,
            y: tile.y,
            width: TILE_SIZE,
            height: TILE_SIZE
        })) {
            // Collision from above (landing)
            if (player.velY > 0 && player.y + player.height - player.velY <= tile.y + 5) {
                player.y = tile.y - player.height;
                player.velY = 0;
                player.onGround = true;
                player.isJumping = false;
            }
            // Collision from below (hitting head)
            else if (player.velY < 0 && player.y - player.velY >= tile.y + TILE_SIZE - 5) {
                player.y = tile.y + TILE_SIZE;
                player.velY = 0;
            }
            // Side collision - game over
            else if (player.velY >= 0 && player.y + player.height > tile.y + 8) {
                gameOver();
                return;
            }
        }
    }

    // Generate new chunks as needed
    while (nextChunkX - scrollOffset < BASE_WIDTH + TILE_SIZE * 16) {
        generateNextChunk();
    }

    // Check if player fell off the screen
    if (player.y > BASE_HEIGHT) {
        gameOver();
    }

    // Keep player from going too far left
    if (player.x < 50) {
        gameOver();
    }

    // Update snowflakes
    updateSnowflakes();
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
    // Draw procedural arctic background
    drawBackground();

    // Draw snowflakes
    drawSnowflakes();

    // Draw tiles
    for (const tile of worldTiles) {
        const screenX = tile.x - scrollOffset;

        // Skip if off screen
        if (screenX < -TILE_SIZE || screenX > BASE_WIDTH) continue;

        if (tile.type === 'ground') {
            // Ground block
            ctx.fillStyle = COLORS.ground;
            ctx.fillRect(screenX, tile.y, TILE_SIZE, TILE_SIZE);

            // Top grass
            ctx.fillStyle = COLORS.groundTop;
            ctx.fillRect(screenX, tile.y, TILE_SIZE, 6);

            // Darker bottom edge
            ctx.fillStyle = COLORS.groundDark;
            ctx.fillRect(screenX, tile.y + TILE_SIZE - 4, TILE_SIZE, 4);

            // Pixel details
            ctx.fillStyle = COLORS.groundDark;
            ctx.fillRect(screenX + 4, tile.y + 12, 4, 4);
            ctx.fillRect(screenX + 16, tile.y + 20, 4, 4);
            ctx.fillRect(screenX + 24, tile.y + 10, 4, 4);
        } else if (tile.type === 'platform') {
            // Platform block
            ctx.fillStyle = COLORS.platform;
            ctx.fillRect(screenX, tile.y, TILE_SIZE, TILE_SIZE);

            // Top highlight
            ctx.fillStyle = COLORS.platformTop;
            ctx.fillRect(screenX, tile.y, TILE_SIZE, 6);

            // Ice crack pattern
            ctx.fillStyle = '#3a6a8a';
            ctx.fillRect(screenX + TILE_SIZE/2 - 1, tile.y, 2, TILE_SIZE);
            ctx.fillRect(screenX, tile.y + TILE_SIZE/2 - 1, TILE_SIZE, 2);
        }
    }

    // Draw player
    const px = player.x;
    const py = player.y;
    const pw = player.width;
    const ph = player.height;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(px + 4, py + ph + 2, pw, 4);

    // Main body
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(px, py, pw, ph);

    // Outline
    ctx.strokeStyle = COLORS.playerOutline;
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(px + pw - 12, py + 8, 6, 6);
    ctx.fillRect(px + pw - 20, py + 8, 6, 6);

    // Pupils (looking right)
    ctx.fillStyle = '#000';
    ctx.fillRect(px + pw - 8, py + 10, 3, 3);
    ctx.fillRect(px + pw - 16, py + 10, 3, 3);

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(px + 2, py + 2, pw - 4, 4);

    // Draw speed meter
    drawSpeedMeter();
}

function drawSpeedMeter() {
    const meterX = BASE_WIDTH - 120;
    const meterY = 16;
    const meterWidth = 100;
    const meterHeight = 16;

    // Speed label
    ctx.fillStyle = '#66ccff';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('SPEED', meterX - 8, meterY + 12);

    // Meter background
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

    // Meter border
    ctx.strokeStyle = '#66ccff';
    ctx.lineWidth = 2;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

    // Speed fill
    const speedPercent = (currentSpeed - START_SPEED) / (MAX_SPEED - START_SPEED);
    const fillWidth = Math.max(0, Math.min(1, speedPercent)) * (meterWidth - 4);

    // Color gradient based on speed (arctic: light blue -> cyan -> white)
    let fillColor;
    if (speedPercent < 0.5) {
        fillColor = '#66ccff'; // Light blue
    } else if (speedPercent < 0.8) {
        fillColor = '#00ffff'; // Cyan
    } else {
        fillColor = '#ffffff'; // White (freezing fast!)
    }

    ctx.fillStyle = fillColor;
    ctx.fillRect(meterX + 2, meterY + 2, fillWidth, meterHeight - 4);

    // Speed value text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(currentSpeed.toFixed(1), meterX + meterWidth / 2, meterY + 12);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start when page loads
window.addEventListener('load', init);
