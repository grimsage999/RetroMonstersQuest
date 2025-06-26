
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let score = 0;
let lives = 3;
let gameState = 'playing'; // 'playing', 'victory', 'gameOver', 'levelComplete'
let currentLevel = 1;
let totalCookies = 0;
let cookiesCollected = 0;

// Level configurations
const levelConfigs = {
    1: {
        background: 'desert_level1_bg.png',
        fbiAgents: 8,
        armyMen: 0,
        radioactiveRats: 0,
        cookies: 8,
        title: 'Level 1: Roswell/Area 51 Desert',
        description: 'Sandy terrain, UFO wreckage, desert shrubs, and hangars'
    },
    2: {
        background: 'city_level2_bg.png',
        fbiAgents: 12,
        armyMen: 6,
        radioactiveRats: 0,
        cookies: 10,
        title: 'Level 2: Crumbling Dystopian City',
        description: 'Cracked pavement, crumbling skyscrapers, neon signs'
    },
    3: {
        background: 'subway_level3_bg.png',
        fbiAgents: 8,
        armyMen: 4,
        radioactiveRats: 6,
        cookies: 12,
        title: 'Level 3: Abandoned Subway',
        description: 'Underground tunnels, graffiti, flickering lights'
    }
};

// Animation variables
let animationFrame = 0;
let animationTimer = 0;
const animationSpeed = 10; // frames between animation updates

// Load sprites
const sprites = {};
const spriteImages = {
    cosmoSpriteSheet: 'cosmo_sprite_sheet.png',
    cookie: 'cookie.png',
    finishLine: 'finish_line.png',
    ciaAgentWalk1: 'cia_agent_walk1.png',
    ciaAgentWalk2: 'cia_agent_walk2.png',
    ciaAgentWalk3: 'cia_agent_walk3.png',
    ciaAgentWalk4: 'cia_agent_walk4.png',
    ciaAgentDead1: 'cia_agent_dead1.png',
    ciaAgentDead2: 'cia_agent_dead2.png',
    armyMenWalk1: 'army_men_walk1.png',
    armyMenWalk2: 'army_men_walk2.png',
    armyMenWalk3: 'army_men_walk3.png',
    armyMenWalk4: 'army_men_walk4.png',
    armyMenDead1: 'army_men_dead1.png',
    armyMenDead2: 'army_men_dead2.png',
    desertBackground: 'desert_level1_bg.png',
    cityBackground: 'city_level2_bg.png',
    subwayBackground: 'subway_level3_bg.png',
    ambientNpcs: 'ambient_npcs.png',
    radioactiveRats: 'radioactive_rats.png',
    rayGunBullets: 'ray_gun_bullets.png',
    ufoWreckage: 'ufo_wreckage.png'};

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

// Player (Cosmo the alien) properties
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 16,
    height: 16,
    speed: 5,
    isMoving: false,
    direction: 'right',
    animationState: 'idle', // 'idle', 'walk', 'jump', 'dodge', 'death', 'celebration'
    animationFrame: 0,
    animationTimer: 0,
    spriteX: 0,
    spriteY: 0
};

// Game objects arrays
const cookies = [];
const ciaAgents = [];
const armyMen = [];
const radioactiveRats = [];
const rayGunBullets = [];

// Finish line
const finishLine = {
    x: canvas.width / 2 - 50,
    y: 20,
    width: 100,
    height: 20
};

// Initialize game objects for current level
function initLevel(level) {
    const config = levelConfigs[level];
    
    // Update canvas background
    canvas.style.backgroundImage = `url('${config.background}')`;
    
    // Reset game objects
    cookies.length = 0;
    ciaAgents.length = 0;
    armyMen.length = 0;
    radioactiveRats.length = 0;
    cookiesCollected = 0;
    
    // Reset player position
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;

    // Create cookies
    for (let i = 0; i < config.cookies; i++) {
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
    for (let i = 0; i < config.fbiAgents; i++) {
        ciaAgents.push({
            x: Math.random() * (canvas.width - 25),
            y: Math.random() * (canvas.height - 200) + 100,
            width: 25,
            height: 25,
            speedX: (Math.random() - 0.5) * 2,
            speedY: (Math.random() - 0.5) * 2,
            animFrame: 0,
            animationState: 'walk'
        });
    }
    
    // Create Army Men (only for level 2+)
    for (let i = 0; i < config.armyMen; i++) {
        armyMen.push({
            x: Math.random() * (canvas.width - 25),
            y: Math.random() * (canvas.height - 200) + 100,
            width: 25,
            height: 25,
            speedX: (Math.random() - 0.5) * 1.5,
            speedY: (Math.random() - 0.5) * 1.5,
            animFrame: 0,
            animationState: 'walk'
        });
    }
    
    // Create Radioactive Rats (only for level 3+)
    for (let i = 0; i < config.radioactiveRats; i++) {
        radioactiveRats.push({
            x: Math.random() * (canvas.width - 20),
            y: Math.random() * (canvas.height - 200) + 100,
            width: 20,
            height: 20,
            speedX: (Math.random() - 0.5) * 3, // Faster and more twitchy
            speedY: (Math.random() - 0.5) * 3,
            animFrame: 0,
            animationState: 'walk',
            health: 3 // Requires 3 ray gun shots to defeat
        });
    }
}

// Legacy function for backward compatibility
function initGame() {
    initLevel(currentLevel);
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
    player.isMoving = false;
    
    if (keys['ArrowUp']) {
        player.y -= player.speed;
        player.isMoving = true;
        player.animationState = 'walk';
    }
    if (keys['ArrowDown']) {
        player.y += player.speed;
        player.isMoving = true;
        player.animationState = 'walk';
    }
    if (keys['ArrowLeft']) {
        player.x -= player.speed;
        player.isMoving = true;
        player.direction = 'left';
        player.animationState = 'walk';
    }
    if (keys['ArrowRight']) {
        player.x += player.speed;
        player.isMoving = true;
        player.direction = 'right';
        player.animationState = 'walk';
    }
    
    // Set idle state when not moving
    if (!player.isMoving) {
        player.animationState = 'idle';
        player.animationFrame = 0; // Reset animation frame for idle
    }
    
    keepPlayerInBounds();
}
// Update Army Men
function updateArmyMen() {
    armyMen.forEach(army => {
        if (army.animationState === 'death') {
            army.animFrame++;
            // Remove army after death animation plays
            if (army.animFrame > 20) { // Adjust frame count as needed
                army.active = false; // Mark for removal
            }
        } else {
            army.x += army.speedX;
            army.y += army.speedY;

            // Bounce off walls
            if (army.x < 0 || army.x + army.width > canvas.width) {
                army.speedX *= -1;
            }
            if (army.y < 0 || army.y + army.height > canvas.height) {
                army.speedY *= -1;
            }
            army.animFrame++;
        }
    });
}

// Update Radioactive Rats
function updateRadioactiveRats() {
    radioactiveRats.forEach(rat => {
        if (rat.animationState === 'death') {
            rat.animFrame++;
            // Remove rat after death animation plays
            if (rat.animFrame > 20) { // Adjust frame count as needed
                rat.active = false; // Mark for removal
            }
        } else {
            rat.x += rat.speedX;
            rat.y += rat.speedY;

            // Bounce off walls
            if (rat.x < 0 || rat.x + rat.width > canvas.width) {
                rat.speedX *= -1;
            }
            if (rat.y < 0 || rat.y + rat.height > canvas.height) {
                rat.speedY *= -1;
            }
            rat.animFrame++;
        }
    });
}
            army.animFrame++;
        }
    });
}

// Update CIA agents
function updateCiaAgents() {
    ciaAgents.forEach(agent => {
        if (agent.animationState === 'death') {
            agent.animFrame++;
            // Remove agent after death animation plays
            if (agent.animFrame > 20) { // Adjust frame count as needed
                agent.active = false; // Mark for removal
            }
        } else {
            agent.x += agent.speedX;
            agent.y += agent.speedY;

            // Bounce off walls
            if (agent.x <= 0 || agent.x + agent.width >= canvas.width) {
                agent.speedX = -agent.speedX;
            }
            if (agent.y <= 0 || agent.y + agent.height >= canvas.height) {
                agent.speedY = -agent.speedY;
            }
            
            agent.animationState = 'walk';
            agent.animFrame++;
        }
    });
}

// Update animations
function updateAnimations() {
    animationTimer++;
    if (animationTimer >= animationSpeed) {
        animationTimer = 0;
        if (player.isMoving) {
            animationFrame = (animationFrame + 1) % 6;
        }
    }
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
        if (agent.active && checkCollision(player, agent)) {
            lives--;
            agent.animationState = 'death';
            agent.animFrame = 0; // Reset animation frame for death
            // Agent will be removed after death animation in updateCiaAgents
            if (lives <= 0) {
                gameState = 'gameOver';
            } else {
                respawnPlayer();
            }
        }
    });
    
    // Check Army Men collisions
    armyMen.forEach(army => {
        if (army.active && checkCollision(player, army)) {
            lives--;
            army.animationState = 'death';
            army.animFrame = 0; // Reset animation frame for death
            // Army will be removed after death animation in updateArmyMen
            if (lives <= 0) {
                gameState = 'gameOver';
            } else {
                respawnPlayer();
            }
        }
    });

    // Check finish line collision
    if (cookiesCollected === totalCookies && checkCollision(player, finishLine)) {
        if (currentLevel < Object.keys(levelConfigs).length) {
            gameState = 'levelComplete';
        } else {
            gameState = 'victory';
        }
    }
}

// Draw functions
function drawPlayer() {
    if (sprites.cosmoSpriteSheet.complete) {
        // Cosmo sprite sheet layout: 4 columns x 3 rows (16x16 each sprite)
        // Row 0: idle, walk1, walk2, walk3
        // Row 1: walk4, wink1, wink2, death1  
        // Row 2: death2, celebration, (unused), (unused)
        
        let spriteX = 0;
        let spriteY = 0;
        
        // Determine sprite position based on animation state
        switch (player.animationState) {
            case 'idle':
                spriteX = 0;
                spriteY = 0;
                break;
            case 'walk':
                // Cycle through walk frames (1-4)
                const walkFrames = [
                    {x: 1, y: 0}, // walk1
                    {x: 2, y: 0}, // walk2  
                    {x: 3, y: 0}, // walk3
                    {x: 0, y: 1}  // walk4
                ];
                const frameIndex = Math.floor(player.animationFrame / 10) % 4;
                spriteX = walkFrames[frameIndex].x;
                spriteY = walkFrames[frameIndex].y;
                break;
            case 'celebration':
                // Alternate between wink frames for celebration
                const celebFrames = [
                    {x: 1, y: 1}, // wink1
                    {x: 2, y: 1}  // wink2
                ];
                const celebIndex = Math.floor(player.animationFrame / 15) % 2;
                spriteX = celebFrames[celebIndex].x;
                spriteY = celebFrames[celebIndex].y;
                break;
            case 'death':
                // Death animation frames
                const deathFrames = [
                    {x: 3, y: 1}, // death1
                    {x: 0, y: 2}  // death2
                ];
                const deathIndex = Math.floor(player.animationFrame / 20) % 2;
                spriteX = deathFrames[deathIndex].x;
                spriteY = deathFrames[deathIndex].y;
                break;
        }
        
        // Draw the sprite
        ctx.save();
        if (player.direction === 'left') {
            ctx.scale(-1, 1);
            ctx.drawImage(
                sprites.cosmoSpriteSheet,
                spriteX * 16, spriteY * 16, 16, 16, // source
                -player.x - player.width, player.y, player.width, player.height // destination
            );
        } else {
            ctx.drawImage(
                sprites.cosmoSpriteSheet,
                spriteX * 16, spriteY * 16, 16, 16, // source
                player.x, player.y, player.width, player.height // destination
            );
        }
        ctx.restore();
        
        // Update animation frame
        player.animationFrame++;
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
        if (agent.animationState === 'death') {
            const deathFrames = [sprites.ciaAgentDead1, sprites.ciaAgentDead2];
            const frameIndex = Math.floor(agent.animFrame / 10) % deathFrames.length;
            ctx.drawImage(deathFrames[frameIndex], agent.x, agent.y, agent.width, agent.height);
        } else {
            const walkFrames = [sprites.ciaAgentWalk1, sprites.ciaAgentWalk2, sprites.ciaAgentWalk3, sprites.ciaAgentWalk4];
            const frameIndex = Math.floor(agent.animFrame / 10) % walkFrames.length;
            ctx.drawImage(walkFrames[frameIndex], agent.x, agent.y, agent.width, agent.height);
        }
    });
}

function drawArmyMen() {
    armyMen.forEach(army => {
        if (army.animationState === 'death') {
            const deathFrames = [sprites.armyMenDead1, sprites.armyMenDead2];
            const frameIndex = Math.floor(army.animFrame / 10) % deathFrames.length;
            ctx.drawImage(deathFrames[frameIndex], army.x, army.y, army.width, army.height);
        } else {
            const walkFrames = [sprites.armyMenWalk1, sprites.armyMenWalk2, sprites.armyMenWalk3, sprites.armyMenWalk4];
            const frameIndex = Math.floor(army.animFrame / 10) % walkFrames.length;
            ctx.drawImage(walkFrames[frameIndex], army.x, army.y, army.width, army.height);
        }
    });
}

// Draw background
function drawBackground() {
    const config = levelConfigs[currentLevel];
    if (sprites.desertBackground && sprites.desertBackground.complete && currentLevel === 1) {
        // Draw desert background for Level 1
        ctx.drawImage(sprites.desertBackground, 0, 0, canvas.width, canvas.height);
    } else if (sprites.cityBackground && sprites.cityBackground.complete && currentLevel === 2) {
        // Draw city background for Level 2
        ctx.drawImage(sprites.cityBackground, 0, 0, canvas.width, canvas.height);
    } else if (sprites.subwayBackground && sprites.subwayBackground.complete && currentLevel === 3) {
        // Draw subway background for Level 3
        ctx.drawImage(sprites.subwayBackground, 0, 0, canvas.width, canvas.height);
    }
}

// Draw UFO wreckage (Level 1 only)
function drawUFOWreckage() {
    if (currentLevel === 1 && sprites.ufoWreckage && sprites.ufoWreckage.complete) {
        // Draw UFO wreckage in the background
        ctx.drawImage(sprites.ufoWreckage, canvas.width - 150, canvas.height - 120, 100, 80);
    }
}

// Draw ambient NPCs (Level 2 only)
function drawAmbientNPCs() {
    if (currentLevel === 2 && sprites.ambientNpcs && sprites.ambientNpcs.complete) {
        // Draw NPCs in windows and alleyways for Level 2
        // NPC 1: In a window (top-left area)
        ctx.drawImage(sprites.ambientNpcs, 0, 0, 16, 18, 100, 50, 16, 18);
        // NPC 2: In an alleyway (bottom-right area)
        ctx.drawImage(sprites.ambientNpcs, 16, 0, 16, 18, canvas.width - 80, canvas.height - 100, 16, 18);
        // NPC 3: In another window (middle area)
        ctx.drawImage(sprites.ambientNpcs, 32, 0, 16, 18, canvas.width / 2, 80, 16, 18);
    }
}

// Draw Radioactive Rats (Level 3 only)
function drawRadioactiveRats() {
    if (currentLevel === 3 && sprites.radioactiveRats && sprites.radioactiveRats.complete) {
        radioactiveRats.forEach(rat => {
            // For now, just draw the first frame of the sprite sheet
            // Assuming the sprite sheet has multiple frames for animation
            ctx.drawImage(sprites.radioactiveRats, 0, 0, 32, 32, rat.x, rat.y, rat.width, rat.height);
        });
    }
}

function drawFinishLine() {
    if (cookiesCollected === totalCookies) {
        // Show UFO when all cookies are collected
        if (sprites.ufoFinish.complete) {
            ctx.drawImage(sprites.ufoFinish, finishLine.x - 25, finishLine.y - 30, finishLine.width + 50, finishLine.height + 40);
        }
    } else {
        // Show regular finish line when cookies not collected
        if (sprites.finishLine.complete) {
            ctx.drawImage(sprites.finishLine, finishLine.x, finishLine.y, finishLine.width, finishLine.height);
        } else {
            // Fallback drawing
            ctx.fillStyle = '#666666';
            ctx.fillRect(finishLine.x, finishLine.y, finishLine.width, finishLine.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('FINISH', finishLine.x + finishLine.width/2, finishLine.y + 15);
        }
    }
}

function drawUI() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Lives: ${lives}`, 10, 60);
    ctx.fillText(`Cookies: ${cookiesCollected}/${totalCookies}`, 10, 90);
    ctx.fillText(`Level: ${currentLevel}`, 10, 120);
    
    if (gameState === 'victory') {
        ctx.fillStyle = '#00ff00';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', canvas.width/2, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText('Press R to restart', canvas.width/2, canvas.height/2 + 50);
    } else if (gameState === 'levelComplete') {
        ctx.fillStyle = '#00ff00';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', canvas.width/2, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText('Press SPACE for next level', canvas.width/2, canvas.height/2 + 50);
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
    currentLevel = 1;
    gameState = 'playing';
    cookies.length = 0;
    ciaAgents.length = 0;
    armyMen.length = 0;
    animationFrame = 0;
    animationTimer = 0;
    initLevel(currentLevel);
    respawnPlayer();
}

// Next level
function nextLevel() {
    if (currentLevel < Object.keys(levelConfigs).length) {
        currentLevel++;
        gameState = 'playing';
        initLevel(currentLevel);
        respawnPlayer();
    } else {
        gameState = 'victory';
    }
}

// Handle restart and level progression
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        if (gameState === 'gameOver' || gameState === 'victory') {
            restartGame();
        }
    }
    if (e.key === ' ' || e.key === 'Space') {
        if (gameState === 'levelComplete') {
            nextLevel();
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
        updateArmyMen();
        updateAnimations();
        checkCollisions();
    }

    // Draw everything
    drawBackground();
    drawUFOWreckage();
    drawAmbientNPCs();
    drawFinishLine();
    drawCookies();
    drawCiaAgents();
    drawArmyMen();
    drawRadioactiveRats();
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


// Mobile touch controls
let touchKeys = {};

// Add touch event listeners for mobile controls
document.addEventListener('DOMContentLoaded', () => {
    const controlButtons = document.querySelectorAll('.control-btn');
    
    controlButtons.forEach(button => {
        const key = button.getAttribute('data-key');
        
        // Touch start
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchKeys[key] = true;
            keys[key] = true;
        });
        
        // Touch end
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchKeys[key] = false;
            keys[key] = false;
        });
        
        // Mouse events for desktop testing
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            touchKeys[key] = true;
            keys[key] = true;
        });
        
        button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            touchKeys[key] = false;
            keys[key] = false;
        });
    });
});

// Responsive canvas sizing
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const maxWidth = Math.min(800, containerWidth - 40); // 20px padding on each side
    
    if (window.innerWidth <= 768) {
        canvas.style.width = maxWidth + 'px';
        canvas.style.height = (maxWidth * 0.75) + 'px'; // Maintain 4:3 aspect ratio
    } else {
        canvas.style.width = '800px';
        canvas.style.height = '600px';
    }
}

// Call resize on load and window resize
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// Prevent scrolling on mobile when touching the game area
document.addEventListener('touchmove', (e) => {
    if (e.target.closest('canvas') || e.target.closest('.mobile-controls')) {
        e.preventDefault();
    }
}, { passive: false });

