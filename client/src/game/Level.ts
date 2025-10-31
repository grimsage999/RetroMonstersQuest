import { Enemy, EnemyType } from './Enemy';
import { LEVEL_CONFIGS } from './GameConfig';
import { OptimizedRenderer } from './OptimizedRenderer';
import { DancingCactus, HazardConfig } from './DancingCactus';
import { SpinningCactus } from './SpinningCactus';
import { Manhole } from './Manhole';
import { Alligator, ManholeSpawnPoint } from './Alligator';
import { AlligatorBoss } from './AlligatorBoss';
import { Necromancer, TombstonePosition } from './Necromancer';

interface Cookie {
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
}

interface LevelConfig {
  background: string;
  fbiAgents: number;
  armyMen: number;
  radioactiveRats: number;
  zombies: number;
  cookies: number;
  title: string;
  description: string;
  hazards: readonly HazardConfig[];
}

export class Level {
  private levelNumber: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private cookies: Cookie[] = [];
  private enemies: Enemy[] = [];
  private hazards: DancingCactus[] = [];
  private spinningCacti: SpinningCactus[] = [];
  private manholes: Manhole[] = [];
  private alligator: Alligator | null = null;
  private alligatorBoss: AlligatorBoss | null = null;
  private necromancer: Necromancer | null = null;
  private finishLine: { x: number; y: number; width: number; height: number; } | null = null;
  private config: LevelConfig;
  private audioManager: any;

  private levelConfigs = LEVEL_CONFIGS;

  constructor(levelNumber: number, canvasWidth: number, canvasHeight: number, audioManager?: any) {
    this.levelNumber = levelNumber;
    // Validate canvas dimensions to prevent edge cases
    this.canvasWidth = Math.max(canvasWidth, 800);
    this.canvasHeight = Math.max(canvasHeight, 600);
    this.config = this.levelConfigs[levelNumber as keyof typeof LEVEL_CONFIGS] || this.levelConfigs[1];
    this.audioManager = audioManager;
    
    this.initializeLevel();
  }

  private initializeLevel() {
    // Initialize finish line - match pattern width for proper centering
    const patternWidth = 13 * 16; // 13 columns × 16 pixels per tile = 208 pixels
    this.finishLine = {
      x: this.canvasWidth / 2 - (patternWidth / 2),
      y: 20,
      width: patternWidth,
      height: 20
    };

    // Create cookies
    this.cookies = [];
    for (let i = 0; i < this.config.cookies; i++) {
      this.cookies.push({
        x: Math.random() * (this.canvasWidth - 20),
        y: Math.random() * (this.canvasHeight - 200) + 100,
        width: 20,
        height: 20,
        collected: false
      });
    }

    // Create enemies
    this.enemies = [];
    
    // CIA Agents
    for (let i = 0; i < this.config.fbiAgents; i++) {
      this.enemies.push(new Enemy(
        Math.random() * (this.canvasWidth - 25),
        Math.random() * (this.canvasHeight - 200) + 100,
        'cia'
      ));
    }
    
    // Army Men
    for (let i = 0; i < this.config.armyMen; i++) {
      this.enemies.push(new Enemy(
        Math.random() * (this.canvasWidth - 25),
        Math.random() * (this.canvasHeight - 200) + 100,
        'army'
      ));
    }
    
    // Radioactive Rats
    for (let i = 0; i < this.config.radioactiveRats; i++) {
      this.enemies.push(new Enemy(
        Math.random() * (this.canvasWidth - 20),
        Math.random() * (this.canvasHeight - 200) + 100,
        'rat'
      ));
    }
    
    // Zombies
    for (let i = 0; i < this.config.zombies; i++) {
      this.enemies.push(new Enemy(
        Math.random() * (this.canvasWidth - 25),
        Math.random() * (this.canvasHeight - 200) + 100,
        'zombie'
      ));
    }
    
    // Initialize hazards
    this.hazards = [];
    this.spinningCacti = [];
    this.manholes = [];
    if (this.config.hazards && this.config.hazards.length > 0) {
      this.config.hazards.forEach((hazardConfig: any) => {
        if (hazardConfig.type === 'dancing_cactus') {
          this.hazards.push(new DancingCactus(
            hazardConfig.position.x,
            hazardConfig.position.y,
            hazardConfig.amplitude,
            hazardConfig.speed
          ));
        } else if (hazardConfig.type === 'spinning_cactus') {
          this.spinningCacti.push(new SpinningCactus({
            x: hazardConfig.position.x,
            y: hazardConfig.position.y,
            spinSpeed: hazardConfig.spin_speed,
            fireballInterval: hazardConfig.fireball.interval,
            fireballSpeed: hazardConfig.fireball.speed,
            fireballHoming: hazardConfig.fireball.homing,
            fireballDamage: hazardConfig.fireball.damage
          }));
        } else if (hazardConfig.type === 'manhole') {
          this.manholes.push(new Manhole(
            hazardConfig.position.x,
            hazardConfig.position.y,
            hazardConfig.openCycleDuration,
            hazardConfig.openDuration
          ));
        }
      });
    }

    // Initialize alligator mini-boss if present in config
    this.alligator = null;
    if ((this.config as any).miniBoss && (this.config as any).miniBoss.type === 'alligator') {
      const miniBossConfig = (this.config as any).miniBoss;
      this.alligator = new Alligator(
        miniBossConfig.manholePositions,
        this.audioManager,
        this.config.cookies
      );
    }

    // Initialize alligator boss (free-roaming) if present in config
    this.alligatorBoss = null;
    if ((this.config as any).miniBoss && (this.config as any).miniBoss.type === 'alligator_boss') {
      const miniBossConfig = (this.config as any).miniBoss;
      this.alligatorBoss = new AlligatorBoss(
        this.audioManager,
        this.config.cookies,
        miniBossConfig.position.x,
        miniBossConfig.position.y
      );
    }

    // Initialize necromancer mini-boss if present in config
    this.necromancer = null;
    if ((this.config as any).miniBoss && (this.config as any).miniBoss.type === 'necromancer') {
      const miniBossConfig = (this.config as any).miniBoss;
      this.necromancer = new Necromancer(
        miniBossConfig.position.x,
        miniBossConfig.position.y,
        miniBossConfig.tombstonePositions,
        this.audioManager,
        this.config.cookies
      );
    }
  }

  public update(deltaTime: number, playerX?: number, playerY?: number, cookiesCollected?: number) {
    // Update all enemies at original speed
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime, this.canvasWidth, this.canvasHeight);
    });
    
    // Update all hazards
    this.hazards.forEach(hazard => {
      hazard.update(deltaTime);
    });

    // Update manholes
    this.manholes.forEach(manhole => {
      manhole.update(deltaTime);
    });

    // Update spinning cacti with player position for targeting
    if (playerX !== undefined && playerY !== undefined) {
      this.spinningCacti.forEach(cactus => {
        cactus.update(deltaTime, playerX, playerY, this.canvasWidth, this.canvasHeight);
      });
    }

    // Update alligator mini-boss
    if (this.alligator && cookiesCollected !== undefined) {
      this.alligator.updateCookieCount(cookiesCollected);
      this.alligator.update(deltaTime, playerX, playerY);
    }

    // Update alligator boss (free-roaming)
    if (this.alligatorBoss && playerX !== undefined && playerY !== undefined && cookiesCollected !== undefined) {
      this.alligatorBoss.updateCookieCount(cookiesCollected);
      this.alligatorBoss.update(deltaTime, playerX, playerY, this.enemies);
    }

    // Update necromancer mini-boss
    if (this.necromancer && playerX !== undefined && playerY !== undefined && cookiesCollected !== undefined) {
      this.necromancer.updateCookieCount(cookiesCollected);
      this.necromancer.updatePlayerPosition(playerX, playerY);
      this.necromancer.update(deltaTime);
    }

    // Check fireball collisions with enemies and cactus
    this.checkFireballCollisions();
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Render background
    this.renderBackground(ctx);
    
    // Render manholes (first, as ground-level hazards)
    this.manholes.forEach(manhole => {
      manhole.render(ctx);
    });

    // Render hazards (before cookies so they're in background layer)
    this.hazards.forEach(hazard => {
      hazard.render(ctx);
    });

    // Render spinning cacti and their fireballs
    this.spinningCacti.forEach(cactus => {
      cactus.render(ctx);
    });
    
    // Render cookies
    this.cookies.forEach(cookie => {
      if (!cookie.collected) {
        this.renderCookie(ctx, cookie);
      }
    });
    
    // Render enemies
    this.enemies.forEach(enemy => {
      enemy.render(ctx);
    });

    // Render alligator mini-boss (on top of everything)
    if (this.alligator) {
      this.alligator.render(ctx);
    }

    // Render alligator boss (free-roaming)
    if (this.alligatorBoss) {
      this.alligatorBoss.render(ctx);
    }

    // Render necromancer mini-boss (on top of everything)
    if (this.necromancer) {
      this.necromancer.render(ctx);
    }
    
    // All level elements rendered
    
    // Render finish line
    this.renderFinishLine(ctx);
  }

  private renderBackground(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    switch (this.levelNumber) {
      case 1: // Desert - Area 51
      case 1.5: // Desert with dancing cacti
      case 1.75: // Desert with spinning cactus
        this.renderDesertBackground(ctx);
        break;
      case 2: // Dystopian City
      case 2.5: // Sewer Streets (same city background)
      case 2.75: // Grease Gator (same city background)
        this.renderCityBackground(ctx);
        break;
      case 3: // Subway
        this.renderSubwayBackground(ctx);
        break;
      case 4: // Graveyard
      case 4.5: // Graveyard with Necromancer
        this.renderGraveyardBackground(ctx);
        break;
      case 5: // Government Lab
        this.renderLabBackground(ctx);
        break;
      default:
        this.renderSpaceBackground(ctx);
    }
    
    ctx.restore();
    
    // Add environmental details
    this.renderEnvironment(ctx);
  }

  private renderDesertBackground(ctx: CanvasRenderingContext2D) {
    // PERFORMANCE FIX: Use solid colors instead of gradients
    ctx.fillStyle = '#FF8C42'; // Warm orange sky
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight * 0.7);
    
    // Simple sun (NO SHADOW BLUR - extremely expensive!)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(this.canvasWidth * 0.8, this.canvasHeight * 0.2, 32, 0, 2 * Math.PI);
    ctx.fill();
    
    // Desert sand - solid color
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, this.canvasHeight * 0.7, this.canvasWidth, this.canvasHeight * 0.3);
    
    // Simple stars - no animation
    ctx.fillStyle = '#FFFF99';
    for (let i = 0; i < 8; i++) {
      const x = (i * this.canvasWidth / 8) + Math.sin(i) * 50;
      const y = (i * this.canvasHeight * 0.05) + 20;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  private renderCityBackground(ctx: CanvasRenderingContext2D) {
    // PERFORMANCE FIX: Solid color sky instead of gradient
    ctx.fillStyle = '#6A0DAD'; // Purple cyberpunk sky
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight * 0.7);
    
    // Add floating geometric shapes (cyberpunk aesthetic)
    ctx.fillStyle = '#00FFFF';
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 8; i++) {
      const x = (i * 100) + Math.sin(Date.now() * 0.001 + i) * 20;
      const y = 50 + Math.cos(Date.now() * 0.002 + i) * 30;
      ctx.fillRect(x, y, 8, 8);
    }
    ctx.globalAlpha = 1;
    
    // Sleek pavement
    ctx.fillStyle = '#483D8B'; // Dark slate blue
    ctx.fillRect(0, this.canvasHeight * 0.7, this.canvasWidth, this.canvasHeight * 0.3);
    
    // Add grid lines for futuristic feel (only for level 2)
    if (this.levelNumber === 2) {
      ctx.strokeStyle = '#00CED1'; // Dark turquoise
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      // Vertical lines
      for (let x = 0; x < this.canvasWidth; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, this.canvasHeight * 0.7);
        ctx.lineTo(x, this.canvasHeight);
        ctx.stroke();
      }
      // Horizontal lines
      for (let y = this.canvasHeight * 0.7; y < this.canvasHeight; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvasWidth, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  private renderSubwayBackground(ctx: CanvasRenderingContext2D) {
    // PERFORMANCE FIX: Solid colors instead of gradients and tile loops
    ctx.fillStyle = '#4A4A4A'; // Gray walls
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight * 0.8);
    
    // Simple floor
    ctx.fillStyle = '#4169E1'; // Blue floor
    ctx.fillRect(0, this.canvasHeight * 0.8, this.canvasWidth, this.canvasHeight * 0.2);
  }

  private renderGraveyardBackground(ctx: CanvasRenderingContext2D) {
    // PERFORMANCE FIX: Solid color instead of gradient
    ctx.fillStyle = '#2F2F2F'; // Dark gray
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Simple moon
    ctx.fillStyle = '#F5F5DC';
    ctx.beginPath();
    ctx.arc(this.canvasWidth * 0.8, this.canvasHeight * 0.2, 28, 0, 2 * Math.PI);
    ctx.fill();
  }

  private renderLabBackground(ctx: CanvasRenderingContext2D) {
    // PERFORMANCE FIX: Solid colors instead of gradients and loops
    ctx.fillStyle = '#F5F5F5'; // White walls
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Simple lighting strips
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(100, 20, 80, 8);
    ctx.fillRect(300, 20, 80, 8);
    ctx.fillRect(500, 20, 80, 8);
    ctx.fillRect(700, 20, 80, 8);
  }

  private renderSpaceBackground(ctx: CanvasRenderingContext2D) {
    // Deep space
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Simplified stars for performance
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 20; i++) {
      const x = (i * 37) % this.canvasWidth;
      const y = (i * 73) % this.canvasHeight;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  private renderEnvironment(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    switch (this.levelNumber) {
      case 1: // Desert - Area 51 with UFO wreckage and structures
      case 1.5: // Desert with dancing cacti hazards
      case 1.75: // Desert with spinning cactus
        this.renderDesertEnvironment(ctx);
        break;
        
      case 2: // City - Dystopian buildings and debris
      case 2.5: // Sewer Streets - Same city environment
      case 2.75: // Grease Gator - Same city environment
        this.renderCityEnvironment(ctx);
        break;
        
      case 3: // Subway - Underground infrastructure
        this.renderSubwayEnvironment(ctx);
        break;
        
      case 4: // Graveyard - Tombstones and dead trees
        this.renderGraveyardEnvironment(ctx);
        break;
        
      case 5: // Government Lab - Lab equipment and desks
        this.renderLabEnvironment(ctx);
        break;
    }
    
    ctx.restore();
  }

  private renderDesertEnvironment(ctx: CanvasRenderingContext2D) {
    // Crashed spacecraft in the center - Cosmo's origin story (Level 1 only)
    if (this.levelNumber !== 1) return;
    
    const spacecraftX = this.canvasWidth / 2 - 80;
    const spacecraftY = this.canvasHeight - 200;
    
    // Animated smoke particles rising from the crash site
    const time = Date.now() * 0.001;
    for (let i = 0; i < 8; i++) {
      const smokeX = spacecraftX + 70 + Math.sin(time + i) * 20;
      const smokeY = spacecraftY - 30 - (time * 15 + i * 25) % 120;
      const smokeSize = 12 + (time * 2 + i * 10) % 20;
      const alpha = 1 - ((time * 15 + i * 25) % 120) / 120;
      
      ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.5})`;
      ctx.fillRect(smokeX - smokeSize / 2, smokeY, smokeSize, smokeSize);
    }
    
    // Crashed spacecraft body (retro 50s style saucer - large enough for pilot)
    ctx.save();
    
    // Large impact crater/scorch marks
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(spacecraftX - 40, spacecraftY + 90, 240, 12);
    ctx.fillStyle = '#1C1C1C';
    ctx.fillRect(spacecraftX - 30, spacecraftY + 93, 220, 6);
    
    // Main saucer body (tilted/crashed)
    ctx.translate(spacecraftX + 80, spacecraftY + 60);
    ctx.rotate(-0.12); // Tilted from crash
    
    // Bottom saucer base (wider)
    ctx.fillStyle = '#5A5A5A';
    ctx.fillRect(-75, 0, 150, 20);
    
    // Landing legs (broken/bent from crash)
    ctx.fillStyle = '#3A3A3A';
    ctx.fillRect(-60, 20, 6, 15);
    ctx.fillRect(54, 20, 6, 12);
    ctx.fillRect(0, 20, 6, 10);
    
    // Middle ring (yellow/orange band with panel details)
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-80, -15, 160, 15);
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(-75, -12, 150, 9);
    
    // Panel lines/rivets on the band
    ctx.fillStyle = '#CC8400';
    for (let x = -70; x < 70; x += 20) {
      ctx.fillRect(x, -14, 2, 13);
    }
    
    // Red accent lights/panels
    ctx.fillStyle = '#DC143C';
    ctx.fillRect(-65, -11, 8, 6);
    ctx.fillRect(57, -11, 8, 6);
    
    // Top dome (large enough for cockpit - gray/silver)
    ctx.fillStyle = '#A8A8A8';
    ctx.fillRect(-50, -45, 100, 30);
    ctx.fillRect(-40, -55, 80, 10);
    ctx.fillRect(-30, -62, 60, 7);
    
    // Dome shading for depth
    ctx.fillStyle = '#8B8B8B';
    ctx.fillRect(-48, -43, 96, 15);
    
    // Large cockpit windows (cyan blue) - big enough to see inside
    ctx.fillStyle = '#00CED1';
    ctx.fillRect(-35, -50, 20, 12);
    ctx.fillRect(15, -50, 20, 12);
    ctx.fillRect(-8, -52, 16, 10);
    
    // Window reflections
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(-33, -49, 8, 5);
    ctx.fillRect(17, -49, 8, 5);
    ctx.globalAlpha = 1;
    
    // Control panel visible through window
    ctx.fillStyle = '#228B22';
    ctx.fillRect(-6, -50, 3, 3);
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(3, -50, 2, 2);
    
    // Damage effects (burn marks and impact damage)
    ctx.fillStyle = '#1C1C1C';
    ctx.fillRect(40, -8, 25, 12);
    ctx.fillRect(-55, 3, 18, 8);
    ctx.fillRect(20, -35, 15, 10);
    
    // Sparking damaged area (orange glow)
    ctx.fillStyle = '#FF6600';
    ctx.globalAlpha = 0.3 + Math.sin(time * 5) * 0.2;
    ctx.fillRect(42, -6, 8, 6);
    ctx.globalAlpha = 1;
    
    ctx.restore();
  }

  private renderCityEnvironment(ctx: CanvasRenderingContext2D) {
    // Dystopian building silhouettes with pixel art detail
    const buildings = [
      { x: 0, height: 120, width: 80 },
      { x: 80, height: 160, width: 90 },
      { x: 170, height: 100, width: 70 },
      { x: 240, height: 180, width: 85 },
      { x: 325, height: 140, width: 75 },
      { x: 400, height: 110, width: 80 },
      { x: 480, height: 200, width: 95 },
      { x: 575, height: 130, width: 70 },
      { x: 645, height: 90, width: 65 },
      { x: 710, height: 150, width: 90 }
    ];

    buildings.forEach(building => {
      const y = this.canvasHeight - building.height;
      
      // Main building structure
      ctx.fillStyle = '#2F2F2F';
      ctx.fillRect(building.x, y, building.width, building.height);
      
      // PERFORMANCE FIX: Simplified windows (no nested loops or Math.random in render)
      ctx.fillStyle = '#FFFF99';
      ctx.fillRect(building.x + 12, y + 20, 6, 6);
      ctx.fillRect(building.x + 12, y + 40, 6, 6);
      ctx.fillStyle = '#1C1C1C';
      ctx.fillRect(building.x + 24, y + 20, 6, 6);
      
      // Simple antenna
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(building.x + building.width/2, y - 8, 2, 8);
    });

    // PERFORMANCE FIX: Neon signs without shadow blur
    ctx.fillStyle = '#FF1493'; // Deep pink neon
    ctx.fillRect(150, this.canvasHeight - 180, 32, 8);
    ctx.fillStyle = '#00FFFF'; // Cyan neon
    ctx.fillRect(350, this.canvasHeight - 160, 24, 6);

    // Debris on street
    ctx.fillStyle = '#1C1C1C';
    const debrisPositions = [120, 280, 420, 580];
    debrisPositions.forEach(x => {
      ctx.fillRect(x, this.canvasHeight - 40, 8, 4);
      ctx.fillRect(x + 12, this.canvasHeight - 35, 6, 3);
    });
  }

  private renderSubwayEnvironment(ctx: CanvasRenderingContext2D) {
    // Support pillars
    const pillarPositions = [150, 350, 550];
    pillarPositions.forEach(x => {
      ctx.fillStyle = '#4A4A4A';
      ctx.fillRect(x, 0, 16, this.canvasHeight);
      
      // Pillar details
      ctx.fillStyle = '#6A6A6A';
      ctx.fillRect(x + 2, 0, 12, this.canvasHeight);
      
      // Rust/wear marks
      ctx.fillStyle = '#8B4513';
      for (let y = 50; y < this.canvasHeight; y += 100) {
        ctx.fillRect(x, y, 16, 8);
      }
    });

    // Subway tracks
    ctx.fillStyle = '#708090'; // Slate gray
    ctx.fillRect(0, this.canvasHeight - 24, this.canvasWidth, 8);
    ctx.fillRect(0, this.canvasHeight - 12, this.canvasWidth, 8);
    
    // Track ties
    ctx.fillStyle = '#654321'; // Dark brown
    for (let x = 0; x < this.canvasWidth; x += 24) {
      ctx.fillRect(x, this.canvasHeight - 28, 16, 20);
    }

    // PERFORMANCE FIX: Simple lights (no gradients or Math.random)
    const lightPositions = [100, 300, 500, 700];
    lightPositions.forEach(x => {
      // Light fixture only
      ctx.fillStyle = '#2F2F2F';
      ctx.fillRect(x - 8, 20, 16, 8);
    });

    // Graffiti tags (simple pixel art)
    ctx.fillStyle = '#FF69B4'; // Hot pink
    ctx.fillRect(200, this.canvasHeight - 200, 24, 16);
    ctx.fillStyle = '#00FF00'; // Lime green
    ctx.fillRect(400, this.canvasHeight - 180, 32, 12);
    
    // Water drips/stains
    ctx.fillStyle = '#1C1C1C';
    const stainPositions = [75, 225, 425, 625];
    stainPositions.forEach(x => {
      for (let y = 100; y < this.canvasHeight - 100; y += 50) {
        ctx.fillRect(x, y, 2, 20);
      }
    });
  }

  private renderGraveyardEnvironment(ctx: CanvasRenderingContext2D) {
    // Crooked tombstones
    const tombstonePositions = [
      { x: 80, y: this.canvasHeight - 120, tilt: -5 },
      { x: 200, y: this.canvasHeight - 110, tilt: 3 },
      { x: 350, y: this.canvasHeight - 125, tilt: -2 },
      { x: 500, y: this.canvasHeight - 115, tilt: 4 },
      { x: 650, y: this.canvasHeight - 130, tilt: -3 }
    ];

    tombstonePositions.forEach(tomb => {
      ctx.save();
      ctx.translate(tomb.x + 12, tomb.y + 30);
      ctx.rotate(tomb.tilt * Math.PI / 180);
      
      // Tombstone base
      ctx.fillStyle = '#696969'; // Dim gray
      ctx.fillRect(-12, -30, 24, 40);
      
      // Tombstone top (rounded)
      ctx.fillRect(-8, -35, 16, 10);
      
      // Moss/weathering
      ctx.fillStyle = '#228B22';
      ctx.fillRect(-10, -20, 4, 6);
      ctx.fillRect(6, -25, 3, 8);
      
      ctx.restore();
    });

    // Dead trees
    const treePositions = [150, 400, 600];
    treePositions.forEach(x => {
      // Tree trunk
      ctx.fillStyle = '#2F2F2F';
      ctx.fillRect(x, this.canvasHeight - 180, 8, 60);
      
      // Bare branches
      ctx.strokeStyle = '#2F2F2F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 4, this.canvasHeight - 160);
      ctx.lineTo(x - 10, this.canvasHeight - 170);
      ctx.moveTo(x + 4, this.canvasHeight - 150);
      ctx.lineTo(x + 18, this.canvasHeight - 165);
      ctx.stroke();
    });
  }

  private renderLabEnvironment(ctx: CanvasRenderingContext2D) {
    // Lab tables/desks
    const tablePositions = [
      { x: 100, y: this.canvasHeight - 80 },
      { x: 300, y: this.canvasHeight - 80 },
      { x: 500, y: this.canvasHeight - 80 }
    ];

    tablePositions.forEach(table => {
      // Table surface
      ctx.fillStyle = '#D3D3D3'; // Light gray
      ctx.fillRect(table.x, table.y, 80, 16);
      
      // Table legs
      ctx.fillStyle = '#A9A9A9';
      ctx.fillRect(table.x + 4, table.y + 16, 4, 20);
      ctx.fillRect(table.x + 72, table.y + 16, 4, 20);
      
      // Lab equipment on tables
      ctx.fillStyle = '#4169E1'; // Royal blue (beakers)
      ctx.fillRect(table.x + 20, table.y - 8, 6, 8);
      ctx.fillStyle = '#32CD32'; // Lime green (liquid)
      ctx.fillRect(table.x + 21, table.y - 6, 4, 4);
      
      // Computer/monitor
      ctx.fillStyle = '#2F2F2F';
      ctx.fillRect(table.x + 40, table.y - 12, 20, 12);
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(table.x + 42, table.y - 10, 16, 8);
    });

    // Wall cabinets
    ctx.fillStyle = '#F5F5F5';
    for (let x = 50; x < this.canvasWidth - 50; x += 120) {
      ctx.fillRect(x, 100, 60, 40);
      // Cabinet doors
      ctx.strokeStyle = '#C0C0C0';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, 100, 60, 40);
      ctx.strokeRect(x + 30, 100, 30, 40);
    }

    // Special bag on desk (The Adjudicator)
    if (this.levelNumber === 5) {
      ctx.fillStyle = '#FFD700'; // Gold
      ctx.fillRect(320, this.canvasHeight - 88, 12, 8);
      // Simplified rendering for performance
    }
  }

  private renderCookie(ctx: CanvasRenderingContext2D, cookie: Cookie) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    // PERFORMANCE: Use optimized renderer - maintains exact same visual quality at 60fps
    OptimizedRenderer.renderOptimizedCookie(ctx, cookie.x, cookie.y);
    
    ctx.restore();
  }

  private renderFinishLine(ctx: CanvasRenderingContext2D) {
    if (!this.finishLine) return; // Guard against null finishLine
    
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    // Checkered finish line pattern (based on reference image)
    const tileSize = 16; // Larger tiles to match character scale
    const pattern = [
      [1,0,1,0,1,0,1,0,1,0,1,0,1], // Black and white checkered
      [0,1,0,1,0,1,0,1,0,1,0,1,0],
      [1,0,1,0,1,0,1,0,1,0,1,0,1],
    ];
    
    const colors = ['#000000', '#ffffff']; // Black and white
    
    // Draw checkered pattern
    for (let row = 0; row < pattern.length; row++) {
      for (let col = 0; col < pattern[row].length; col++) {
        const colorIndex = pattern[row][col];
        ctx.fillStyle = colors[colorIndex];
        ctx.fillRect(
          this.finishLine.x + col * tileSize,
          this.finishLine.y + row * (this.finishLine.height / 3),
          tileSize,
          this.finishLine.height / 3
        );
      }
    }
    
    // Add "FINISH" text in pixel font style
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 2;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', this.finishLine.x + this.finishLine.width/2, this.finishLine.y + 12);
    
    ctx.restore();
  }

  public checkCookieCollisions(playerBounds: { x: number; y: number; width: number; height: number; }): number {
    let collected = 0;
    
    this.cookies.forEach(cookie => {
      if (!cookie.collected && this.checkCollision(playerBounds, cookie)) {
        cookie.collected = true;
        collected++;
      }
    });
    
    return collected;
  }

  public checkEnemyCollisions(playerBounds: { x: number; y: number; width: number; height: number; }): boolean {
    return this.enemies.some(enemy => 
      enemy.isActive() && this.checkCollision(playerBounds, enemy.getBounds())
    );
  }

  public checkHazardCollisions(playerBounds: { x: number; y: number; width: number; height: number; }): boolean {
    // Check dancing cacti
    const dancingCactusHit = this.hazards.some(hazard => 
      this.checkCollision(playerBounds, hazard.getBounds())
    );

    // Check spinning cacti (including fireballs)
    const spinningCactusHit = this.spinningCacti.some(cactus =>
      cactus.checkCollision(playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height)
    );

    // Check manholes (only dangerous when open)
    const manholeHit = this.manholes.some(manhole =>
      manhole.isDangerous() && this.checkCollision(playerBounds, manhole.getBounds())
    );

    return dancingCactusHit || spinningCactusHit || manholeHit;
  }

  public checkAlligatorCollision(playerBounds: { x: number; y: number; width: number; height: number; }): boolean {
    if (!this.alligator) {
      return false;
    }
    return this.alligator.checkPlayerCollision(playerBounds.x, playerBounds.y, playerBounds.width);
  }

  public getAlligator(): Alligator | null {
    return this.alligator;
  }

  public playAlligatorIntro(): void {
    if (this.alligator) {
      this.alligator.playIntroSequence();
    }
  }

  public completeAlligatorIntro(): void {
    if (this.alligator) {
      this.alligator.completeIntro();
    }
  }

  public checkNecromancerCollision(playerBounds: { x: number; y: number; width: number; height: number; }): boolean {
    if (!this.necromancer) {
      return false;
    }
    
    // Check broom melee attack
    const broomHit = this.necromancer.checkBroomCollision(
      playerBounds.x,
      playerBounds.y,
      playerBounds.width,
      playerBounds.height
    );
    
    // Check ghost collisions
    const ghostHit = this.necromancer.checkGhostCollisions(
      playerBounds.x,
      playerBounds.y,
      playerBounds.width,
      playerBounds.height
    );
    
    return broomHit || (ghostHit !== null);
  }

  public getNecromancer(): Necromancer | null {
    return this.necromancer;
  }

  public checkAlligatorBossCollision(playerBounds: { x: number; y: number; width: number; height: number; }): boolean {
    if (!this.alligatorBoss) {
      return false;
    }
    
    // Check bite collision
    const biteHit = this.alligatorBoss.checkPlayerCollision(playerBounds.x, playerBounds.y, playerBounds.width);
    
    // Check spit projectile collision
    const spitHit = this.alligatorBoss.checkSpitCollision(playerBounds.x, playerBounds.y, playerBounds.width);
    
    return biteHit || spitHit;
  }

  public getAlligatorBoss(): AlligatorBoss | null {
    return this.alligatorBoss;
  }

  public playAlligatorBossIntro(): void {
    if (this.alligatorBoss) {
      this.alligatorBoss.playIntroSequence();
    }
  }

  public completeAlligatorBossIntro(): void {
    if (this.alligatorBoss) {
      this.alligatorBoss.completeIntro();
    }
  }

  public playNecromancerIntro(): void {
    if (this.necromancer) {
      this.necromancer.playIntroSequence();
    }
  }

  public completeNecromancerIntro(): void {
    if (this.necromancer) {
      this.necromancer.completeIntro();
    }
  }

  private checkCollision(rect1: { x: number; y: number; width: number; height: number; }, rect2: { x: number; y: number; width: number; height: number; }): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  private checkFireballCollisions(): void {
    // For each spinning cactus, check its fireballs against enemies and itself
    this.spinningCacti.forEach(cactus => {
      if (!cactus.isAlive()) return;

      const fireballs = cactus.getFireballs();
      const cactusCenter = cactus.getPosition();

      fireballs.forEach(fireball => {
        if (!fireball.isAlive()) return;

        const fbBounds = fireball.getBounds();

        // Fireballs hit enemies in their path as they chase the player
        this.enemies = this.enemies.filter(enemy => {
          if (!enemy.isActive()) return true; // Keep inactive enemies

          const enemyBounds = enemy.getBounds();
          const hit = this.checkCollision(fbBounds, enemyBounds);

          if (hit) {
            console.log('Fireball hit enemy! Enemy destroyed.');
            fireball.kill();
            return false; // Remove enemy
          }
          return true; // Keep enemy
        });

        // Fireballs also hit the cactus if it's in their path (player dodged away)
        if (fireball.isAlive()) {
          const cactusBounds = cactus.getBounds();
          const hit = this.checkCollision(fbBounds, cactusBounds);

          if (hit) {
            console.log('Fireball hit cactus! Damage dealt.');
            fireball.kill();
            cactus.takeDamage(1);
          }
        }
      });
    });

    // Remove destroyed cacti
    this.spinningCacti = this.spinningCacti.filter(cactus => cactus.isAlive());
  }

  public getTotalCookies(): number {
    return this.cookies.length;
  }

  public getEnemies(): Enemy[] {
    return this.enemies;
  }

  public getFinishLine() {
    return this.finishLine;
  }

  // Boss system removed - no longer needed
}
