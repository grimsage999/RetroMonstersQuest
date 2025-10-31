export interface ManholeSpawnPoint {
  x: number;
  y: number;
}

export type AttackType = 'bite' | 'grab';

export class Alligator {
  private manholePositions: ManholeSpawnPoint[];
  private currentManholeIndex: number = -1;
  private attackCooldown: number = 0;
  private attackType: AttackType | null = null;
  private attackState: 'idle' | 'warning' | 'emerging' | 'attacking' | 'retreating' = 'idle';
  private stateTimer: number = 0;
  private ambientLaughTimer: number = 0;
  private nextAmbientLaughDelay: number = 0;
  private isIntroComplete: boolean = false;
  private emergenceProgress: number = 0;
  private shakeIntensity: number = 0;
  private audioManager: any;
  private cookieCount: number = 0;
  private totalCookies: number = 0;
  private playerX: number = 0;
  private playerY: number = 0;

  private readonly WARNING_DURATION = 1500;
  private readonly EMERGENCE_DURATION = 400;
  private readonly ATTACK_DURATION = 600;
  private readonly RETREAT_DURATION = 400;

  constructor(manholePositions: ManholeSpawnPoint[], audioManager: any, totalCookies: number) {
    this.manholePositions = manholePositions;
    this.audioManager = audioManager;
    this.totalCookies = totalCookies;
    this.cookieCount = totalCookies;
    this.resetAmbientLaughTimer();
  }

  private resetAmbientLaughTimer(): void {
    const baseDelay = 10000 + Math.random() * 10000;
    const skipChance = Math.random() < 0.3;
    this.nextAmbientLaughDelay = skipChance ? baseDelay * 2 : baseDelay;
  }

  private playAmbientLaugh(): void {
    if (this.audioManager && this.audioManager.playSound) {
      const audio = new Audio('/sounds/success.mp3');
      audio.playbackRate = 0.5;
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }
  }

  private playAttackLaugh(): void {
    if (this.audioManager && this.audioManager.playSound) {
      const audio = new Audio('/sounds/success.mp3');
      audio.playbackRate = 0.6;
      audio.volume = 0.6;
      audio.play().catch(() => {});
    }
  }

  private playSinisterLaugh(): void {
    if (this.audioManager && this.audioManager.playSound) {
      const audio = new Audio('/sounds/success.mp3');
      audio.playbackRate = 0.4;
      audio.volume = 0.7;
      audio.play().catch(() => {});
    }
  }

  public playIntroSequence(): void {
    this.playSinisterLaugh();
    this.isIntroComplete = false;
  }

  public completeIntro(): void {
    this.isIntroComplete = true;
  }

  public updateCookieCount(cookiesCollected: number): void {
    this.cookieCount = this.totalCookies - cookiesCollected;
  }

  private getAttackCooldown(): number {
    const cookieRatio = this.cookieCount / this.totalCookies;
    
    if (cookieRatio > 0.7) {
      return 4000 + Math.random() * 1000;
    } else if (cookieRatio > 0.3) {
      return 3000 + Math.random() * 1000;
    } else {
      return 2000 + Math.random() * 1000;
    }
  }

  private selectNearestManhole(playerX: number, playerY: number): number {
    let nearestIndex = 0;
    let minDistance = Infinity;
    
    this.manholePositions.forEach((manhole, index) => {
      const dx = (manhole.x + 24) - playerX;
      const dy = (manhole.y + 24) - playerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });
    
    return nearestIndex;
  }

  private selectRandomAttackType(): AttackType {
    const rand = Math.random();
    if (rand < 0.15) {
      return this.attackType === 'bite' ? 'bite' : 'grab';
    }
    return Math.random() < 0.5 ? 'bite' : 'grab';
  }

  public update(deltaTime: number, playerX?: number, playerY?: number): void {
    if (!this.isIntroComplete) {
      return;
    }

    // Track player position for neck direction
    if (playerX !== undefined && playerY !== undefined) {
      this.playerX = playerX;
      this.playerY = playerY;
    }

    this.ambientLaughTimer += deltaTime;
    if (this.ambientLaughTimer >= this.nextAmbientLaughDelay) {
      if (this.attackState === 'idle') {
        this.playAmbientLaugh();
      }
      this.ambientLaughTimer = 0;
      this.resetAmbientLaughTimer();
    }

    this.stateTimer += deltaTime;

    switch (this.attackState) {
      case 'idle':
        this.attackCooldown -= deltaTime;
        if (this.attackCooldown <= 0) {
          if (playerX !== undefined && playerY !== undefined) {
            this.currentManholeIndex = this.selectNearestManhole(playerX, playerY);
          } else {
            this.currentManholeIndex = Math.floor(Math.random() * this.manholePositions.length);
          }
          this.attackType = this.selectRandomAttackType();
          this.attackState = 'warning';
          this.stateTimer = 0;
          this.shakeIntensity = 0;
          this.playAttackLaugh();
        }
        break;

      case 'warning':
        this.shakeIntensity = Math.sin(this.stateTimer * 0.02) * 3;
        if (this.stateTimer >= this.WARNING_DURATION) {
          this.attackState = 'emerging';
          this.stateTimer = 0;
          this.emergenceProgress = 0;
        }
        break;

      case 'emerging':
        this.emergenceProgress = Math.min(1, this.stateTimer / this.EMERGENCE_DURATION);
        if (this.stateTimer >= this.EMERGENCE_DURATION) {
          this.attackState = 'attacking';
          this.stateTimer = 0;
        }
        break;

      case 'attacking':
        if (this.stateTimer >= this.ATTACK_DURATION) {
          this.attackState = 'retreating';
          this.stateTimer = 0;
        }
        break;

      case 'retreating':
        this.emergenceProgress = Math.max(0, 1 - (this.stateTimer / this.RETREAT_DURATION));
        if (this.stateTimer >= this.RETREAT_DURATION) {
          this.attackState = 'idle';
          this.stateTimer = 0;
          this.currentManholeIndex = -1;
          this.attackType = null;
          this.emergenceProgress = 0;
          this.shakeIntensity = 0;
          this.attackCooldown = this.getAttackCooldown();
        }
        break;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.currentManholeIndex < 0 || !this.attackType) {
      return;
    }

    const manhole = this.manholePositions[this.currentManholeIndex];
    
    if (this.attackState === 'warning') {
      this.renderWarning(ctx, manhole.x, manhole.y);
    }

    if (this.attackState === 'emerging' || this.attackState === 'attacking' || this.attackState === 'retreating') {
      this.renderAlligator(ctx, manhole.x, manhole.y);
    }
  }

  private renderWarning(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();

    const pulse = Math.sin(this.stateTimer * 0.01) * 0.3 + 0.7;
    
    ctx.fillStyle = `rgba(255, 50, 0, ${pulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(x + 24 + this.shakeIntensity, y + 24, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 100, 0, ${pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + 24 + this.shakeIntensity, y + 24, 28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private renderAlligator(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const centerX = x + 24;
    const centerY = y + 24;
    const emergeHeight = this.emergenceProgress * 60;

    ctx.fillStyle = '#4A5F3A';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 30, 20 - emergeHeight * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyY = centerY - emergeHeight;

    ctx.fillStyle = '#5A7D4A';
    ctx.fillRect(centerX - 18, bodyY, 36, emergeHeight);

    ctx.fillStyle = '#E8D4A0';
    ctx.fillRect(centerX - 14, bodyY + 8, 28, Math.max(0, emergeHeight - 12));

    const stainCount = 3;
    ctx.fillStyle = '#8B7355';
    for (let i = 0; i < stainCount; i++) {
      const stainY = bodyY + 10 + i * 8;
      if (stainY < centerY) {
        ctx.fillRect(centerX - 8 + i * 4, stainY, 6, 4);
      }
    }

    if (this.emergenceProgress > 0.5) {
      const baseHeadY = bodyY - 20;
      let headY = baseHeadY;
      let headX = centerX;
      let neckExtension = 0;
      
      if (this.attackState === 'attacking') {
        const attackProgress = Math.min(1, this.stateTimer / (this.ATTACK_DURATION * 0.6));
        neckExtension = Math.sin(attackProgress * Math.PI) * 100;
        
        // Calculate direction toward player
        const dx = this.playerX - centerX;
        const dy = this.playerY - baseHeadY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          // Normalize and apply extension - reach toward player aggressively
          const dirX = dx / distance;
          const dirY = dy / distance;
          headX = centerX + dirX * neckExtension;
          headY = baseHeadY + dirY * neckExtension;
        } else {
          headY = baseHeadY - neckExtension;
        }
        
        if (neckExtension > 5) {
          ctx.fillStyle = '#5A7D4A';
          const neckSegments = 4;
          for (let i = 0; i < neckSegments; i++) {
            const t = i / neckSegments;
            const segmentX = centerX + (headX - centerX) * t;
            const segmentY = baseHeadY + (headY - baseHeadY) * t;
            const segmentWidth = 16 - (i * 2);
            ctx.fillRect(segmentX - segmentWidth / 2, segmentY, segmentWidth, neckExtension / neckSegments + 2);
            
            ctx.fillStyle = '#E8D4A0';
            ctx.fillRect(segmentX - (segmentWidth / 2 - 2), segmentY + 2, segmentWidth - 4, neckExtension / neckSegments - 2);
            ctx.fillStyle = '#5A7D4A';
          }
        }
      }
      
      ctx.fillStyle = '#4A5F3A';
      ctx.fillRect(headX - 22, headY, 44, 24);

      ctx.fillStyle = '#FF0000';
      ctx.fillRect(headX - 16, headY + 6, 6, 6);
      ctx.fillRect(headX + 10, headY + 6, 6, 6);

      if (this.attackType === 'bite' && this.attackState === 'attacking') {
        const jawOpen = Math.sin(this.stateTimer * 0.02) * 6;
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(headX - 18 + i * 8, headY + 18 + jawOpen, 4, 6);
        }
      }

      if (this.attackType === 'grab' && this.attackState === 'attacking') {
        ctx.strokeStyle = '#4A5F3A';
        ctx.lineWidth = 4;
        
        ctx.beginPath();
        ctx.moveTo(headX - 24, headY + 24);
        ctx.lineTo(headX - 32, headY + 24 + neckExtension * 0.3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(headX + 24, headY + 24);
        ctx.lineTo(headX + 32, headY + 24 + neckExtension * 0.3);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  public checkPlayerCollision(playerX: number, playerY: number, playerSize: number): boolean {
    if (this.attackState !== 'attacking' || this.currentManholeIndex < 0) {
      return false;
    }

    const manhole = this.manholePositions[this.currentManholeIndex];
    const centerX = manhole.x + 24;
    const centerY = manhole.y + 24;
    const emergeHeight = this.emergenceProgress * 60;
    const bodyY = centerY - emergeHeight;
    const baseHeadY = bodyY - 20;
    
    const attackProgress = Math.min(1, this.stateTimer / (this.ATTACK_DURATION * 0.6));
    const neckExtension = Math.sin(attackProgress * Math.PI) * 100;
    
    // Calculate head position toward player
    let headX = centerX;
    let headY = baseHeadY;
    
    const dx = this.playerX - centerX;
    const dy = this.playerY - baseHeadY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const dirX = dx / distance;
      const dirY = dy / distance;
      headX = centerX + dirX * neckExtension;
      headY = baseHeadY + dirY * neckExtension;
    } else {
      headY = baseHeadY - neckExtension;
    }

    const attackRadius = this.attackType === 'grab' ? 60 : 55;

    const dxPlayer = (playerX + playerSize / 2) - headX;
    const dyPlayer = (playerY + playerSize / 2) - headY;
    const distanceToPlayer = Math.sqrt(dxPlayer * dxPlayer + dyPlayer * dyPlayer);

    return distanceToPlayer < attackRadius;
  }

  public isIntroReady(): boolean {
    return !this.isIntroComplete;
  }
}
