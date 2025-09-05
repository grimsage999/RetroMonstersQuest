import { Enemy, EnemyType } from './Enemy';
import { LEVEL_CONFIGS } from './GameConfig';
import { OptimizedRenderer } from './OptimizedRenderer';

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
}

export class Level {
  private levelNumber: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private cookies: Cookie[] = [];
  private enemies: Enemy[] = [];
  private finishLine: { x: number; y: number; width: number; height: number; } | null = null;
  private config: LevelConfig;

  private levelConfigs = LEVEL_CONFIGS;

  constructor(levelNumber: number, canvasWidth: number, canvasHeight: number) {
    this.levelNumber = levelNumber;
    // Validate canvas dimensions to prevent edge cases
    this.canvasWidth = Math.max(canvasWidth, 800);
    this.canvasHeight = Math.max(canvasHeight, 600);
    this.config = this.levelConfigs[levelNumber as keyof typeof LEVEL_CONFIGS] || this.levelConfigs[1];
    
    this.initializeLevel();
  }

  private initializeLevel() {
    // Initialize finish line
    this.finishLine = {
      x: this.canvasWidth / 2 - 50,
      y: 20,
      width: 100,
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
    
    // Level 5 setup complete - no boss needed
  }

  public update(deltaTime: number) {
    // Update all enemies at original speed
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime, this.canvasWidth, this.canvasHeight);
    });
    
    // All level elements updated
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Render background
    this.renderBackground(ctx);
    
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
    
    // All level elements rendered
    
    // Render finish line
    this.renderFinishLine(ctx);
  }

  private renderBackground(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    switch (this.levelNumber) {
      case 1: // Desert - Area 51
        this.renderDesertBackground(ctx);
        break;
      case 2: // Dystopian City
        this.renderCityBackground(ctx);
        break;
      case 3: // Subway
        this.renderSubwayBackground(ctx);
        break;
      case 4: // Graveyard
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
    // Beautiful desert sunset sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight * 0.7);
    skyGradient.addColorStop(0, '#FF6B35'); // Orange sunset
    skyGradient.addColorStop(0.3, '#FF8C42'); // Warm orange
    skyGradient.addColorStop(0.6, '#FFAA44'); // Golden
    skyGradient.addColorStop(1, '#F4A460'); // Sandy transition
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight * 0.7);
    
    // Add stylized sun
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(this.canvasWidth * 0.8, this.canvasHeight * 0.2, 32, 0, 2 * Math.PI);
    ctx.fill();
    
    // Desert sand with warm tones
    const sandGradient = ctx.createLinearGradient(0, this.canvasHeight * 0.7, 0, this.canvasHeight);
    sandGradient.addColorStop(0, '#DEB887'); // Burlywood
    sandGradient.addColorStop(1, '#CD853F'); // Peru
    ctx.fillStyle = sandGradient;
    ctx.fillRect(0, this.canvasHeight * 0.7, this.canvasWidth, this.canvasHeight * 0.3);
    
    // PERFORMANCE OPTIMIZATION: Simplified sand dunes - larger chunks, less math
    for (let x = 0; x < this.canvasWidth; x += 32) {
      const waveHeight = Math.sin(x * 0.01) * 8;
      ctx.fillStyle = '#F4A460';
      ctx.fillRect(x, this.canvasHeight * 0.7 + waveHeight, 32, this.canvasHeight * 0.3 - waveHeight);
    }
    
    // PERFORMANCE OPTIMIZATION: Simplified star rendering - remove animation
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFF99';
    ctx.globalAlpha = 0.8;
    // Reduced from 20 to 8 stars for better performance
    for (let i = 0; i < 8; i++) {
      const x = (i * this.canvasWidth / 8) + Math.sin(i) * 50;
      const y = (i * this.canvasHeight * 0.05) + 20;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  private renderCityBackground(ctx: CanvasRenderingContext2D) {
    // Vibrant cyberpunk sky with aurora-like colors
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight * 0.7);
    skyGradient.addColorStop(0, '#4B0082'); // Indigo
    skyGradient.addColorStop(0.3, '#8A2BE2'); // Blue violet
    skyGradient.addColorStop(0.6, '#DA70D6'); // Orchid
    skyGradient.addColorStop(1, '#2F4F4F'); // Dark slate gray
    ctx.fillStyle = skyGradient;
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
    
    // Sleek pavement with grid pattern
    ctx.fillStyle = '#483D8B'; // Dark slate blue
    ctx.fillRect(0, this.canvasHeight * 0.7, this.canvasWidth, this.canvasHeight * 0.3);
    
    // Add grid lines for futuristic feel
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

  private renderSubwayBackground(ctx: CanvasRenderingContext2D) {
    // Atmospheric underground with warm lighting
    const wallGradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight * 0.8);
    wallGradient.addColorStop(0, '#4A4A4A'); // Medium gray
    wallGradient.addColorStop(0.5, '#6A5ACD'); // Slate blue
    wallGradient.addColorStop(1, '#2F2F2F'); // Dark gray
    ctx.fillStyle = wallGradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight * 0.8);
    
    // Colorful mosaic floor tiles
    const tileSize = 16;
    const tileColors = ['#4169E1', '#1E90FF', '#00CED1', '#20B2AA', '#4682B4'];
    for (let x = 0; x < this.canvasWidth; x += tileSize) {
      for (let y = this.canvasHeight * 0.8; y < this.canvasHeight; y += tileSize) {
        const colorIndex = ((x + y) / tileSize) % tileColors.length;
        ctx.fillStyle = tileColors[colorIndex];
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x, y, tileSize, tileSize);
        
        // Add tile borders
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#1C1C1C';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, tileSize, tileSize);
      }
    }
    
    // Simplified lighting for better performance
  }

  private renderGraveyardBackground(ctx: CanvasRenderingContext2D) {
    // Spooky graveyard atmosphere with mist
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    skyGradient.addColorStop(0, '#2F2F2F'); // Dark gray
    skyGradient.addColorStop(0.4, '#404040'); // Medium gray
    skyGradient.addColorStop(1, '#1C1C1C'); // Very dark ground
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Simplified moon for performance
    ctx.fillStyle = '#F5F5DC';
    ctx.beginPath();
    ctx.arc(this.canvasWidth * 0.8, this.canvasHeight * 0.2, 28, 0, 2 * Math.PI);
    ctx.fill();
    
    // Simplified background for performance
  }

  private renderLabBackground(ctx: CanvasRenderingContext2D) {
    // Sterile government lab environment
    const bgGradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    bgGradient.addColorStop(0, '#E0E0E0'); // Light gray ceiling
    bgGradient.addColorStop(0.3, '#F5F5F5'); // White walls
    bgGradient.addColorStop(0.7, '#DCDCDC'); // Gray floor transition
    bgGradient.addColorStop(1, '#C0C0C0'); // Darker floor
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Add fluorescent lighting strips
    ctx.fillStyle = '#FFFFFF';
    for (let x = 100; x < this.canvasWidth; x += 200) {
      ctx.fillRect(x, 20, 80, 8);
      // Simplified for performance
    }
    
    // Add grid floor pattern
    ctx.strokeStyle = '#B0B0B0';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.canvasWidth; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, this.canvasHeight * 0.7);
      ctx.lineTo(x, this.canvasHeight);
      ctx.stroke();
    }
    for (let y = this.canvasHeight * 0.7; y < this.canvasHeight; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvasWidth, y);
      ctx.stroke();
    }
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
        this.renderDesertEnvironment(ctx);
        break;
        
      case 2: // City - Dystopian buildings and debris
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
    // UFO wreckage scattered around
    const wreckagePositions = [
      { x: 100, y: this.canvasHeight - 120 },
      { x: 300, y: this.canvasHeight - 100 },
      { x: 600, y: this.canvasHeight - 110 }
    ];

    wreckagePositions.forEach(pos => {
      // Crashed UFO parts (pixel art style)
      ctx.fillStyle = '#4682B4'; // Steel blue
      ctx.fillRect(pos.x, pos.y, 24, 8);
      ctx.fillStyle = '#2F4F4F'; // Dark slate gray
      ctx.fillRect(pos.x + 4, pos.y - 4, 16, 4);
      
      // Burn marks
      ctx.fillStyle = '#1C1C1C';
      ctx.fillRect(pos.x - 8, pos.y + 8, 40, 4);
    });

    // Desert cacti (8-bit style)
    const cactiPositions = [150, 450, 700];
    cactiPositions.forEach(x => {
      const y = this.canvasHeight - 80;
      // Main stem
      ctx.fillStyle = '#228B22';
      ctx.fillRect(x, y, 8, 32);
      // Arms
      ctx.fillRect(x - 8, y + 8, 8, 8);
      ctx.fillRect(x + 8, y + 12, 8, 8);
      // Spines
      ctx.fillStyle = '#FFFF00';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + i * 2, y + i * 8, 1, 2);
      }
    });

    // Area 51 hangar in background
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(50, this.canvasHeight * 0.4, 120, 80);
    ctx.fillStyle = '#1C1C1C';
    ctx.fillRect(60, this.canvasHeight * 0.4 + 10, 100, 60);
    
    // Warning signs
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(250, this.canvasHeight - 60, 16, 16);
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('!', 256, this.canvasHeight - 50);
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
      
      // Windows (some lit, some dark)
      const windowSize = 6;
      const windowSpacing = 12;
      for (let wx = building.x + 8; wx < building.x + building.width - 8; wx += windowSpacing) {
        for (let wy = y + 16; wy < y + building.height - 16; wy += windowSpacing) {
          const isLit = Math.random() > 0.7;
          ctx.fillStyle = isLit ? '#FFFF99' : '#1C1C1C';
          ctx.fillRect(wx, wy, windowSize, windowSize);
        }
      }
      
      // Antenna or details on top
      if (Math.random() > 0.5) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(building.x + building.width/2, y - 8, 2, 8);
      }
    });

    // Neon signs
    ctx.fillStyle = '#FF1493'; // Deep pink neon
    ctx.shadowColor = '#FF1493';
    ctx.shadowBlur = 4;
    ctx.fillRect(150, this.canvasHeight - 180, 32, 8);
    ctx.fillStyle = '#00FFFF'; // Cyan neon
    ctx.shadowColor = '#00FFFF';
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

    // Flickering lights (simulated with random brightness)
    const lightPositions = [100, 300, 500, 700];
    lightPositions.forEach(x => {
      const brightness = Math.random() > 0.8 ? 0.5 : 0.2;
      const lightGradient = ctx.createRadialGradient(x, 30, 0, x, 30, 60);
      lightGradient.addColorStop(0, `rgba(255, 255, 255, ${brightness})`);
      lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = lightGradient;
      ctx.fillRect(x - 60, 0, 120, 120);
      
      // Light fixture
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

  private checkCollision(rect1: { x: number; y: number; width: number; height: number; }, rect2: { x: number; y: number; width: number; height: number; }): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
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
