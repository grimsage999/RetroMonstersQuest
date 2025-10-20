export interface FireballConfig {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  homing: boolean;
  damage: number;
}

export class Fireball {
  public x: number;
  public y: number;
  private velocityX: number = 0;
  private velocityY: number = 0;
  private speed: number;
  private homing: boolean;
  private damage: number;
  private size: number = 16;
  private alive: boolean = true;
  private trailPositions: Array<{ x: number; y: number; alpha: number }> = [];
  private redirected: boolean = false; // Becomes true when player dodges (gets close)

  constructor(config: FireballConfig) {
    this.x = config.x;
    this.y = config.y;
    this.speed = config.speed;
    this.homing = config.homing;
    this.damage = config.damage;

    // Calculate initial direction
    const dx = config.targetX - this.x;
    const dy = config.targetY - this.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    
    if (magnitude > 0) {
      this.velocityX = (dx / magnitude) * this.speed;
      this.velocityY = (dy / magnitude) * this.speed;
    }
  }

  public update(deltaTime: number, playerX: number, playerY: number, canvasWidth: number, canvasHeight: number): void {
    if (!this.alive) return;

    // Check if fireball is close to player (dodge detection for redirect mechanic)
    const playerCenterX = playerX + 24;
    const playerCenterY = playerY + 24;
    const distanceToPlayer = Math.sqrt(
      Math.pow(this.x - playerCenterX, 2) + Math.pow(this.y - playerCenterY, 2)
    );
    
    // If fireball gets within 70 pixels of player, it's been "redirected"
    if (!this.redirected && distanceToPlayer < 70) {
      this.redirected = true;
      console.log('Fireball redirected! Can now damage enemies/cactus.');
    }

    // Homing behavior - slightly adjust direction toward player
    if (this.homing) {
      const dx = playerCenterX - this.x; // Target center of player
      const dy = playerCenterY - this.y;
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      
      if (magnitude > 0) {
        // Slight course correction (10% adjustment)
        const targetVelX = (dx / magnitude) * this.speed;
        const targetVelY = (dy / magnitude) * this.speed;
        
        this.velocityX += (targetVelX - this.velocityX) * 0.1;
        this.velocityY += (targetVelY - this.velocityY) * 0.1;
        
        // Re-normalize to maintain constant speed
        const currentMagnitude = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (currentMagnitude > 0) {
          this.velocityX = (this.velocityX / currentMagnitude) * this.speed;
          this.velocityY = (this.velocityY / currentMagnitude) * this.speed;
        }
      }
    }

    // Update trail
    this.trailPositions.unshift({ x: this.x, y: this.y, alpha: 1.0 });
    if (this.trailPositions.length > 5) {
      this.trailPositions.pop();
    }

    // Update trail alpha
    this.trailPositions.forEach((trail, index) => {
      trail.alpha = 1 - (index / 5);
    });

    // Move fireball
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Check boundaries
    if (this.x < -this.size || this.x > canvasWidth + this.size ||
        this.y < -this.size || this.y > canvasHeight + this.size) {
      this.alive = false;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    // Draw trail
    this.trailPositions.forEach((trail, index) => {
      ctx.save();
      ctx.globalAlpha = trail.alpha * 0.6;
      const trailSize = this.size * (1 - index / 10);
      
      // Outer glow
      const gradient = ctx.createRadialGradient(trail.x, trail.y, 0, trail.x, trail.y, trailSize);
      gradient.addColorStop(0, '#FF6600');
      gradient.addColorStop(0.5, '#FF3300');
      gradient.addColorStop(1, 'rgba(255, 51, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(trail.x - trailSize, trail.y - trailSize, trailSize * 2, trailSize * 2);
      ctx.restore();
    });

    // Draw main fireball
    ctx.save();
    
    // Outer glow
    const outerGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 1.5);
    outerGlow.addColorStop(0, '#FFAA00');
    outerGlow.addColorStop(0.5, '#FF6600');
    outerGlow.addColorStop(1, 'rgba(255, 102, 0, 0)');
    
    ctx.fillStyle = outerGlow;
    ctx.fillRect(this.x - this.size * 1.5, this.y - this.size * 1.5, this.size * 3, this.size * 3);
    
    // Core fireball
    const coreGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
    coreGradient.addColorStop(0, '#FFFF00');
    coreGradient.addColorStop(0.5, '#FF9900');
    coreGradient.addColorStop(1, '#FF3300');
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  public isAlive(): boolean {
    return this.alive;
  }

  public kill(): void {
    this.alive = false;
  }

  public getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      width: this.size,
      height: this.size
    };
  }

  public getDamage(): number {
    return this.damage;
  }

  public isRedirected(): boolean {
    return this.redirected;
  }
}
