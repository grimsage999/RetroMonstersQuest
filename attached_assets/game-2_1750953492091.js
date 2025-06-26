
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let score = 0;
let lives = 3;
let gameState = 'playing'; // 'playing', 'victory', 'gameOver'
let totalCookies = 0;
let cookiesCollected = 0;

// Load sprites
const sprites = {};
const spriteImages = {
    alienUfo: 'alien_ufo.png',
    cookie: 'cookie.png',
    ciaAgent: 'cia_agent.png',
    finishLine: 'finish_line.png'
};

// Load all sprites
let spritesLoaded = 0;
const totalSprites = Object.keys(spriteImages).length;

Object.keys(spriteImages).forEach(key => {
    sprites[key] = new Image();
    sprites[key].onload = () => {
        spritesLoaded++;
        if (spritesLoaded === totalSprites) {
            initGame();
            gameLoop();
        }
    };
    sprites[key].src = spriteImages[key];
});

// Player (alien/UFO) properties
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 30,
    height: 30,
    speed: 5
};

// Game objects arrays
const cookies = [];
const ciaAgents = [];

// Finish line
const finishLine = {
    x: canvas.width / 2 - 50,
    y: 20,
    width: 100,
    height: 20
};

// Initialize game objects
function initGame() {
    // Create cookies
    for (let i = 0; i < 8; i++) {
        cookies.push({
            x: Math.random() * (canvas.width - 20),
            y: Math.random() * (canvas.height - 200) + 100,
            width: 20,
            height: 20,
            collected: false
        });
    }
    totalCookies = cookies.length;

    // Create CIA agents
    for (let i = 0; i < 4; i++) {
        ciaAgents.push({
            x: Math.random() * (canvas.width - 25),
            y: Math.random() * (canvas.height - 200) + 100,
            width: 25,
            height: 25,
            speedX: (Math.random() - 0.5) * 2,
            speedY: (Math.random() - 0.5) * 2
        });
    }
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Respawn player
function respawnPlayer() {
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;
}

// Keep player within bounds
function keepPlayerInBounds() {
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
}

// Event listeners for player movement
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Update player movement
function updatePlayer() {
    if (keys['ArrowUp']) player.y -= player.speed;
    if (keys['ArrowDown']) player.y += player.speed;
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    
    keepPlayerInBounds();
}

// Update CIA agents
function updateCiaAgents() {
    ciaAgents.forEach(agent => {
        agent.x += agent.speedX;
        agent.y += agent.speedY;

        // Bounce off walls
        if (agent.x <= 0 || agent.x + agent.width >= canvas.width) {
            agent.speedX = -agent.speedX;
        }
        if (agent.y <= 0 || agent.y + agent.height >= canvas.height) {
            agent.speedY = -agent.speedY;
        }
    });
}

// Check collisions
function checkCollisions() {
    // Check cookie collisions
    cookies.forEach(cookie => {
        if (!cookie.collected && checkCollision(player, cookie)) {
            cookie.collected = true;
            score += 10;
            cookiesCollected++;
        }
    });

    // Check CIA agent collisions
    ciaAgents.forEach(agent => {
        if (checkCollision(player, agent)) {
            lives--;
            if (lives <= 0) {
                gameState = 'gameOver';
            } else {
                respawnPlayer();
            }
        }
    });

    // Check finish line collision
    if (cookiesCollected === totalCookies && checkCollision(player, finishLine)) {
        gameState = 'victory';
    }
}

// Draw functions
function drawPlayer() {
    if (sprites.alienUfo.complete) {
        ctx.drawImage(sprites.alienUfo, player.x, player.y, player.width, player.height);
    } else {
        // Fallback drawing
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}

function drawCookies() {
    cookies.forEach(cookie => {
        if (!cookie.collected) {
            if (sprites.cookie.complete) {
                ctx.drawImage(sprites.cookie, cookie.x, cookie.y, cookie.width, cookie.height);
            } else {
                // Fallback drawing
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(cookie.x + cookie.width/2, cookie.y + cookie.height/2, cookie.width/2, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    });
}

function drawCiaAgents() {
    ciaAgents.forEach(agent => {
        if (sprites.ciaAgent.complete) {
            ctx.drawImage(sprites.ciaAgent, agent.x, agent.y, agent.width, agent.height);
        } else {
            // Fallback drawing
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(agent.x, agent.y, agent.width, agent.height);
        }
    });
}

function drawFinishLine() {
    if (sprites.finishLine.complete) {
        ctx.drawImage(sprites.finishLine, finishLine.x, finishLine.y, finishLine.width, finishLine.height);
    } else {
        // Fallback drawing
        ctx.fillStyle = cookiesCollected === totalCookies ? '#00ff00' : '#666666';
        ctx.fillRect(finishLine.x, finishLine.y, finishLine.width, finishLine.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FINISH', finishLine.x + finishLine.width/2, finishLine.y + 15);
    }
}

function drawUI() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Lives: ${lives}`, 10, 60);
    ctx.fillText(`Cookies: ${cookiesCollected}/${totalCookies}`, 10, 90);
    
    if (gameState === 'victory') {
        ctx.fillStyle = '#00ff00';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', canvas.width/2, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText('Press R to restart', canvas.width/2, canvas.height/2 + 50);
    } else if (gameState === 'gameOver') {
        ctx.fillStyle = '#ff0000';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText('Press R to restart', canvas.width/2, canvas.height/2 + 50);
    }
}

// Restart game
function restartGame() {
    score = 0;
    lives = 3;
    cookiesCollected = 0;
    gameState = 'playing';
    cookies.length = 0;
    ciaAgents.length = 0;
    initGame();
    respawnPlayer();
}

// Handle restart
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        if (gameState === 'victory' || gameState === 'gameOver') {
            restartGame();
        }
    }
});

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'playing') {
        // Update game objects
        updatePlayer();
        updateCiaAgents();
        checkCollisions();
    }

    // Draw everything
    drawFinishLine();
    drawCookies();
    drawCiaAgents();
    drawPlayer();
    drawUI();

    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Show loading message until sprites are loaded
ctx.fillStyle = '#ffffff';
ctx.font = '24px Arial';
ctx.textAlign = 'center';
ctx.fillText('Loading sprites...', canvas.width/2, canvas.height/2);

