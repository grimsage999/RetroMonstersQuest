import { logger } from './Logger';

export class BubbleShield {
  private active: boolean = false;
  private duration: number = 4000;
  private cooldown: number = 8000;
  private activeTime: number = 0;
  private cooldownTime: number = 0;
  private radius: number = 80;
  private expandRadius: number = 0;
  private pulseOffset: number = 0;
  private sparkles: Array<{ angle: number; distance: number; life: number }> = [];

  constructor() {
    logger.info('BubbleShield initialized');
  }

  public activate(): boolean {
    if (this.active || this.cooldownTime > 0) {
      logger.debug(`BubbleShield activation blocked - active: ${this.active}, cooldown: ${this.cooldownTime}ms`);
      return false;
    }

    this.active = true;
    this.activeTime = this.duration;
    this.expandRadius = 0;
    this.sparkles = [];
    
    for (let i = 0; i < 12; i++) {
      this.sparkles.push({
        angle: (Math.PI * 2 * i) / 12,
        distance: this.radius,
        life: 1
      });
    }

    logger.info('🛡️ BUBBLE SHIELD ACTIVATED!');
    return true;
  }

  public update(deltaTime: number): void {
    // deltaTime is already in milliseconds (consistent with rest of game engine)
    if (this.active) {
      this.activeTime -= deltaTime;
      this.pulseOffset += deltaTime * 0.003;
      
      this.expandRadius = Math.min(this.expandRadius + deltaTime * 0.2, this.radius);

      this.sparkles.forEach(sparkle => {
        sparkle.angle += deltaTime * 0.002;
        sparkle.life = Math.max(0, sparkle.life - deltaTime * 0.0003);
      });

      if (this.activeTime <= 0) {
        this.deactivate();
      }
    }

    if (this.cooldownTime > 0) {
      this.cooldownTime -= deltaTime;
      if (this.cooldownTime <= 0) {
        this.cooldownTime = 0;
        logger.info('🛡️ Bubble Shield ready!');
      }
    }
  }

  private deactivate(): void {
    this.active = false;
    this.cooldownTime = this.cooldown;
    this.sparkles = [];
    logger.info('🛡️ Bubble Shield deactivated - entering cooldown');
  }

  public render(ctx: CanvasRenderingContext2D, playerX: number, playerY: number): void {
    if (!this.active) return;

    const centerX = playerX + 16;
    const centerY = playerY + 16;
    const currentRadius = this.expandRadius + Math.sin(this.pulseOffset) * 5;

    ctx.save();

    const outerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, currentRadius);
    outerGradient.addColorStop(0, 'rgba(50, 255, 50, 0.1)');
    outerGradient.addColorStop(0.7, 'rgba(50, 255, 150, 0.3)');
    outerGradient.addColorStop(0.9, 'rgba(50, 255, 50, 0.5)');
    outerGradient.addColorStop(1, 'rgba(50, 255, 50, 0)');
    
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(100, 255, 100, ${0.6 + Math.sin(this.pulseOffset * 2) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ff00';
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(150, 255, 150, ${0.4 + Math.sin(this.pulseOffset * 2.5) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius - 8, 0, Math.PI * 2);
    ctx.stroke();

    this.sparkles.forEach(sparkle => {
      const x = centerX + Math.cos(sparkle.angle) * sparkle.distance;
      const y = centerY + Math.sin(sparkle.angle) * sparkle.distance;
      
      ctx.fillStyle = `rgba(200, 255, 200, ${sparkle.life * 0.8})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ff00';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  public isActive(): boolean {
    return this.active;
  }

  public getRadius(): number {
    return this.expandRadius;
  }

  public getCooldownPercent(): number {
    if (this.cooldownTime <= 0) return 1;
    return 1 - (this.cooldownTime / this.cooldown);
  }

  public isOnCooldown(): boolean {
    return this.cooldownTime > 0;
  }

  public checkEnemyCollision(enemyX: number, enemyY: number, enemyWidth: number, enemyHeight: number, playerX: number, playerY: number): boolean {
    if (!this.active) return false;

    const centerX = playerX + 16;
    const centerY = playerY + 16;
    
    const enemyCenterX = enemyX + enemyWidth / 2;
    const enemyCenterY = enemyY + enemyHeight / 2;
    
    const distance = Math.sqrt(
      Math.pow(enemyCenterX - centerX, 2) +
      Math.pow(enemyCenterY - centerY, 2)
    );

    return distance < this.expandRadius;
  }

  public getRepulsionForce(enemyX: number, enemyY: number, enemyWidth: number, enemyHeight: number, playerX: number, playerY: number): { dx: number; dy: number } {
    if (!this.active) return { dx: 0, dy: 0 };

    const centerX = playerX + 16;
    const centerY = playerY + 16;
    
    const enemyCenterX = enemyX + enemyWidth / 2;
    const enemyCenterY = enemyY + enemyHeight / 2;
    
    const dx = enemyCenterX - centerX;
    const dy = enemyCenterY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0 || distance > this.expandRadius) {
      return { dx: 0, dy: 0 };
    }

    const force = 300;
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;

    return {
      dx: normalizedDx * force,
      dy: normalizedDy * force
    };
  }
}
