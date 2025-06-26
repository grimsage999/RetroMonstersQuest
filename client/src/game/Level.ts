import { Enemy, EnemyType } from './Enemy';

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
  private finishLine: any;
  private config: LevelConfig;

  private levelConfigs: { [key: number]: LevelConfig } = {
    1: {
      background: '#8B4513',
      fbiAgents: 8,
      armyMen: 0,
      radioactiveRats: 0,
      cookies: 8,
      title: 'Level 1: Roswell/Area 51 Desert',
      description: 'Sandy terrain, UFO wreckage, desert shrubs, and hangars'
    },
    2: {
      background: '#2F4F4F',
      fbiAgents: 12,
      armyMen: 6,
      radioactiveRats: 0,
      cookies: 10,
      title: 'Level 2: Crumbling Dystopian City',
      description: 'Cracked pavement, crumbling skyscrapers, neon signs'
    },
    3: {
      background: '#1C1C1C',
      fbiAgents: 8,
      armyMen: 4,
      radioactiveRats: 6,
      cookies: 12,
      title: 'Level 3: Abandoned Subway',
      description: 'Underground tunnels, graffiti, flickering lights'
    }
  };

  constructor(levelNumber: number, canvasWidth: number, canvasHeight: number) {
    this.levelNumber = levelNumber;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.config = this.levelConfigs[levelNumber] || this.levelConfigs[1];
    
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
  }

  public update(deltaTime: number) {
    // Update enemies
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime, this.canvasWidth, this.canvasHeight);
    });
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
    
    // Render finish line
    this.renderFinishLine(ctx);
  }

  private renderBackground(ctx: CanvasRenderingContext2D) {
    // Simple gradient background based on level
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    
    switch (this.levelNumber) {
      case 1: // Desert
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#8B4513');
        break;
      case 2: // City
        gradient.addColorStop(0, '#2F4F4F');
        gradient.addColorStop(1, '#000000');
        break;
      case 3: // Subway
        gradient.addColorStop(0, '#1C1C1C');
        gradient.addColorStop(1, '#000000');
        break;
      default:
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(1, '#000000');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Add some environmental details
    this.renderEnvironment(ctx);
  }

  private renderEnvironment(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    switch (this.levelNumber) {
      case 1: // Desert - add some rocks and cacti
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 5; i++) {
          const x = (i * 150) + 50;
          const y = this.canvasHeight - 80;
          ctx.fillRect(x, y, 20, 20); // Rock
        }
        break;
        
      case 2: // City - add some building silhouettes
        ctx.fillStyle = '#333333';
        for (let i = 0; i < 8; i++) {
          const x = i * 100;
          const height = 50 + Math.random() * 100;
          ctx.fillRect(x, this.canvasHeight - height, 80, height);
        }
        break;
        
      case 3: // Subway - add some pillars and tracks
        ctx.fillStyle = '#666666';
        for (let i = 0; i < 4; i++) {
          const x = (i * 200) + 100;
          ctx.fillRect(x, 0, 20, this.canvasHeight); // Pillars
        }
        // Subway tracks
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, this.canvasHeight - 30);
        ctx.lineTo(this.canvasWidth, this.canvasHeight - 30);
        ctx.stroke();
        break;
    }
    
    ctx.restore();
  }

  private renderCookie(ctx: CanvasRenderingContext2D, cookie: Cookie) {
    ctx.save();
    
    // Draw cookie as a golden circle with chocolate chips
    ctx.fillStyle = '#DAA520';
    ctx.beginPath();
    ctx.arc(cookie.x + cookie.width/2, cookie.y + cookie.height/2, cookie.width/2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Chocolate chips
    ctx.fillStyle = '#8B4513';
    const chipSize = 2;
    for (let i = 0; i < 3; i++) {
      const chipX = cookie.x + 4 + (i * 4);
      const chipY = cookie.y + 4 + (i % 2) * 4;
      ctx.fillRect(chipX, chipY, chipSize, chipSize);
    }
    
    // Glowing effect
    ctx.shadowColor = '#DAA520';
    ctx.shadowBlur = 5;
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cookie.x + cookie.width/2, cookie.y + cookie.height/2, cookie.width/2 + 2, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.restore();
  }

  private renderFinishLine(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Animated finish line
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 10;
    ctx.fillRect(this.finishLine.x, this.finishLine.y, this.finishLine.width, this.finishLine.height);
    
    // Add "FINISH" text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', this.finishLine.x + this.finishLine.width/2, this.finishLine.y + 15);
    
    ctx.restore();
  }

  public checkCookieCollisions(playerBounds: any): number {
    let collected = 0;
    
    this.cookies.forEach(cookie => {
      if (!cookie.collected && this.checkCollision(playerBounds, cookie)) {
        cookie.collected = true;
        collected++;
      }
    });
    
    return collected;
  }

  public checkEnemyCollisions(playerBounds: any): boolean {
    return this.enemies.some(enemy => 
      enemy.isActive() && this.checkCollision(playerBounds, enemy.getBounds())
    );
  }

  private checkCollision(rect1: any, rect2: any): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  public getTotalCookies(): number {
    return this.cookies.length;
  }

  public getFinishLine() {
    return this.finishLine;
  }
}
