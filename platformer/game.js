// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const TILE_SIZE = 32;
const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const JUMP_CUT_MULTIPLIER = 0.4; // Velocity multiplier when releasing jump early

// Speed settings
const START_SPEED = 2;
const MAX_SPEED = 8;
const SPEED_INCREMENT = 0.001; // Speed increase per frame
let currentSpeed = START_SPEED;

// Colors - oldschool palette
const COLORS = {
    sky: '#1a1a2e',
    player: '#ff6b6b',
    playerOutline: '#cc4444',
    ground: '#4a7c59',
    groundTop: '#6ab04c',
    groundDark: '#2d4a35',
    platform: '#8b7355',
    platformTop: '#a0826d',
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

// Initialize
function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Disable image smoothing for pixel art
    ctx.imageSmoothingEnabled = false;

    // Generate initial chunks
    generateInitialWorld();

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('click', handleClick);

    // Start game loop
    requestAnimationFrame(gameLoop);
}

function generateInitialWorld() {
    worldTiles = [];
    nextChunkX = 0;
    chunksGenerated = 0;

    // Generate enough chunks to fill screen plus buffer
    while (nextChunkX < CANVAS_WIDTH + TILE_SIZE * 16) {
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
    e.preventDefault();
    player.jumpKeyHeld = true;
    handleInput();
}

function handleTouchEnd(e) {
    e.preventDefault();
    player.jumpKeyHeld = false;

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
    while (nextChunkX - scrollOffset < CANVAS_WIDTH + TILE_SIZE * 16) {
        generateNextChunk();
    }

    // Check if player fell off the screen
    if (player.y > CANVAS_HEIGHT) {
        gameOver();
    }

    // Keep player from going too far left
    if (player.x < 50) {
        gameOver();
    }
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
    // Clear canvas
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background grid (subtle)
    ctx.strokeStyle = '#252540';
    ctx.lineWidth = 1;
    for (let x = -(scrollOffset % TILE_SIZE); x < CANVAS_WIDTH; x += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }

    // Draw tiles
    for (const tile of worldTiles) {
        const screenX = tile.x - scrollOffset;

        // Skip if off screen
        if (screenX < -TILE_SIZE || screenX > CANVAS_WIDTH) continue;

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

            // Brick pattern
            ctx.fillStyle = '#6b5344';
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
    const meterX = CANVAS_WIDTH - 120;
    const meterY = 16;
    const meterWidth = 100;
    const meterHeight = 16;

    // Speed label
    ctx.fillStyle = '#33ff33';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('SPEED', meterX - 8, meterY + 12);

    // Meter background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

    // Meter border
    ctx.strokeStyle = '#33ff33';
    ctx.lineWidth = 2;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

    // Speed fill
    const speedPercent = (currentSpeed - START_SPEED) / (MAX_SPEED - START_SPEED);
    const fillWidth = Math.max(0, Math.min(1, speedPercent)) * (meterWidth - 4);

    // Color gradient based on speed (green -> yellow -> red)
    let fillColor;
    if (speedPercent < 0.5) {
        fillColor = '#33ff33'; // Green
    } else if (speedPercent < 0.8) {
        fillColor = '#ffff33'; // Yellow
    } else {
        fillColor = '#ff3333'; // Red
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
