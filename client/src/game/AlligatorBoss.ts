export type BossAttackType = 'bite' | 'eat_and_spit';

export interface EatenEnemy {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  id: string;
}

export class AlligatorBoss {
  private x: number;
  private y: number;
  private width: number = 60;
  private height: number = 60;
  private velocityX: number = 0;
  private velocityY: number = 0;
  private attackCooldown: number = 0;
  private attackType: BossAttackType | null = null;
  private attackState: 'idle' | 'warning' | 'attacking' | 'cooldown' = 'idle';
  private stateTimer: number = 0;
  private audioManager: any;
  private cookieCount: number = 0;
  private totalCookies: number = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private isIntroComplete: boolean = false;
  private eatenEnemies: EatenEnemy[] = [];
  private mouthOpen: number = 0;
  private facingDirection: number = 1; // 1 = right, -1 = left
  private swallowedThisCycle: string[] = []; // Track enemies eaten during current attack
  private neckExtension: number = 0;
  private headX: number = 0;
  private headY: number = 0;

  private readonly WARNING_DURATION = 1000;
  private readonly ATTACK_DURATION = 1200;
  private readonly COOLDOWN_DURATION = 500;
  private readonly MOVE_SPEED = 1.5;
  private readonly BITE_RANGE = 120;
  private readonly EAT_RANGE = 100;

  constructor(audioManager: any, totalCookies: number, startX: number = 400, startY: number = 350) {
    this.audioManager = audioManager;
    this.totalCookies = totalCookies;
    this.cookieCount = totalCookies;
    this.x = startX;
    this.y = startY;
  }

  private playIntroLaugh(): void {
    if (this.audioManager && this.audioManager.playSound) {
      const audio = new Audio('/sounds/success.mp3');
      audio.playbackRate = 0.4;
      audio.volume = 0.7;
      audio.play().catch(() => {});
    }
  }

  private playAttackSound(): void {
    if (this.audioManager && this.audioManager.playSound) {
      const audio = new Audio('/sounds/success.mp3');
      audio.playbackRate = 0.6;
      audio.volume = 0.6;
      audio.play().catch(() => {});
    }
  }

  private playEatSound(): void {
    if (this.audioManager && this.audioManager.playSound) {
      const audio = new Audio('/sounds/hit.mp3');
      audio.playbackRate = 0.5;
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }

  public playIntroSequence(): void {
    this.playIntroLaugh();
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

  private selectAttackType(): BossAttackType {
    // 60% chance for eat_and_spit if there are enemies nearby, otherwise bite
    return Math.random() < 0.6 ? 'eat_and_spit' : 'bite';
  }

  private moveTowardPlayer(): void {
    const dx = this.playerX - (this.x + this.width / 2);
    const dy = this.playerY - (this.y + this.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 50) {
      this.velocityX = (dx / distance) * this.MOVE_SPEED;
      this.velocityY = (dy / distance) * this.MOVE_SPEED;
      
      // Update facing direction
      if (dx > 0) {
        this.facingDirection = 1;
      } else if (dx < 0) {
        this.facingDirection = -1;
      }
    } else {
      this.velocityX *= 0.8;
      this.velocityY *= 0.8;
    }
  }

  public update(
    deltaTime: number, 
    playerX?: number, 
    playerY?: number,
    enemies?: Array<{ getBounds(): { x: number; y: number; width: number; height: number }; isActive(): boolean; destroy(): void; getId?(): string }>
  ): void {
    if (!this.isIntroComplete) {
      return;
    }

    // Track player position
    if (playerX !== undefined && playerY !== undefined) {
      this.playerX = playerX;
      this.playerY = playerY;
    }

    // Update position
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Keep within bounds
    this.x = Math.max(0, Math.min(800 - this.width, this.x));
    this.y = Math.max(0, Math.min(600 - this.height, this.y));

    // Update eaten enemies (projectiles)
    this.eatenEnemies = this.eatenEnemies.filter(enemy => {
      enemy.x += enemy.velocityX;
      enemy.y += enemy.velocityY;
      
      // Remove if out of bounds
      return enemy.x > -50 && enemy.x < 850 && enemy.y > -50 && enemy.y < 650;
    });

    this.stateTimer += deltaTime;

    switch (this.attackState) {
      case 'idle':
        this.moveTowardPlayer();
        this.attackCooldown -= deltaTime;
        
        if (this.attackCooldown <= 0) {
          this.attackType = this.selectAttackType();
          this.attackState = 'warning';
          this.stateTimer = 0;
          this.swallowedThisCycle = []; // Reset swallowed enemies for new attack
          this.playAttackSound();
        }
        break;

      case 'warning':
        // Slow down during warning
        this.velocityX *= 0.9;
        this.velocityY *= 0.9;
        
        if (this.stateTimer >= this.WARNING_DURATION) {
          this.attackState = 'attacking';
          this.stateTimer = 0;
        }
        break;

      case 'attacking':
        if (this.attackType === 'bite') {
          // Move slowly toward player during bite
          const dx = this.playerX - (this.x + this.width / 2);
          const dy = this.playerY - (this.y + this.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            this.velocityX = (dx / distance) * this.MOVE_SPEED * 0.8;
            this.velocityY = (dy / distance) * this.MOVE_SPEED * 0.8;
          }
          
          // Extend neck toward player
          const attackProgress = Math.min(1, this.stateTimer / (this.ATTACK_DURATION * 0.7));
          this.neckExtension = Math.sin(attackProgress * Math.PI) * 80;
          
          // Calculate head position
          const baseHeadX = this.x + this.width / 2;
          const baseHeadY = this.y + this.height / 2 - 20;
          
          if (distance > 0 && this.neckExtension > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            this.headX = baseHeadX + dirX * this.neckExtension;
            this.headY = baseHeadY + dirY * this.neckExtension;
          } else {
            this.headX = baseHeadX;
            this.headY = baseHeadY;
          }
          
          this.mouthOpen = Math.sin(this.stateTimer * 0.01) * 12;
        } else if (this.attackType === 'eat_and_spit') {
          // Eat nearby enemies - track which ones we actually swallow
          if (this.stateTimer < this.ATTACK_DURATION * 0.4 && enemies) {
            enemies.forEach((enemy, index) => {
              if (enemy.isActive()) {
                const bounds = enemy.getBounds();
                const dx = bounds.x - this.x;
                const dy = bounds.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.EAT_RANGE) {
                  const enemyId = enemy.getId?.() || `enemy_${index}_${Date.now()}`;
                  // Only eat if not already swallowed this cycle
                  if (!this.swallowedThisCycle.includes(enemyId)) {
                    enemy.destroy();
                    this.swallowedThisCycle.push(enemyId);
                    this.playEatSound();
                  }
                }
              }
            });
          }
          
          // Spit ONLY the enemies we swallowed this cycle
          if (this.stateTimer > this.ATTACK_DURATION * 0.5 && this.stateTimer < this.ATTACK_DURATION * 0.6 && this.swallowedThisCycle.length > 0) {
            const enemiesToSpit = Math.min(3, this.swallowedThisCycle.length);
            
            for (let i = 0; i < enemiesToSpit; i++) {
              const dx = this.playerX - (this.x + this.width / 2);
              const dy = this.playerY - (this.y + this.height / 2);
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance > 0) {
                const spread = (Math.random() - 0.5) * 0.3;
                this.eatenEnemies.push({
                  x: this.x + this.width / 2,
                  y: this.y + this.height / 2,
                  velocityX: (dx / distance) * 8 + spread,
                  velocityY: (dy / distance) * 8 + spread,
                  id: `spit_${Date.now()}_${i}`
                });
              }
            }
            // Clear the swallowed list after spitting so we don't reuse them
            this.swallowedThisCycle = [];
          }
        }
        
        if (this.stateTimer >= this.ATTACK_DURATION) {
          this.attackState = 'cooldown';
          this.stateTimer = 0;
          this.mouthOpen = 0;
          this.neckExtension = 0;
        }
        break;

      case 'cooldown':
        this.velocityX *= 0.85;
        this.velocityY *= 0.85;
        this.neckExtension *= 0.8; // Retract neck
        
        if (this.stateTimer >= this.COOLDOWN_DURATION) {
          this.attackState = 'idle';
          this.stateTimer = 0;
          this.attackType = null;
          this.attackCooldown = this.getAttackCooldown();
          this.neckExtension = 0;
        }
        break;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Render spit projectiles
    this.eatenEnemies.forEach(enemy => {
      ctx.fillStyle = '#654321';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, 16, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(enemy.x - 4, enemy.y - 4, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Warning indicator
    if (this.attackState === 'warning') {
      const pulse = Math.sin(this.stateTimer * 0.01) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 50, 0, ${pulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render detailed pixel art alligator
    ctx.save();
    if (this.facingDirection === -1) {
      ctx.translate(this.x + this.width, this.y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(this.x, this.y);
    }

    const scale = 2;

    // Legs (humanoid stance)
    ctx.fillStyle = '#5A7D4A';
    ctx.fillRect(12 * scale, 42 * scale, 8 * scale, 18 * scale);
    ctx.fillRect(30 * scale, 42 * scale, 8 * scale, 18 * scale);
    
    // Feet/claws
    ctx.fillStyle = '#4A5F3A';
    ctx.fillRect(10 * scale, 58 * scale, 12 * scale, 4 * scale);
    ctx.fillRect(28 * scale, 58 * scale, 12 * scale, 4 * scale);
    
    // Claws on feet
    ctx.fillStyle = '#FFFACD';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect((11 + i * 3) * scale, 60 * scale, 2 * scale, 2 * scale);
      ctx.fillRect((29 + i * 3) * scale, 60 * scale, 2 * scale, 2 * scale);
    }

    // Main body (green)
    ctx.fillStyle = '#5A7D4A';
    ctx.fillRect(8 * scale, 18 * scale, 34 * scale, 28 * scale);
    
    // Belly (beige/tan)
    ctx.fillStyle = '#E8D4A0';
    ctx.fillRect(14 * scale, 22 * scale, 22 * scale, 22 * scale);

    // White tank top
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(12 * scale, 20 * scale, 26 * scale, 24 * scale);
    
    // Grease stains on tank top (brown/yellow)
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(16 * scale, 24 * scale, 6 * scale, 4 * scale);
    ctx.fillRect(26 * scale, 30 * scale, 8 * scale, 5 * scale);
    ctx.fillRect(18 * scale, 36 * scale, 5 * scale, 3 * scale);
    
    // More stains
    ctx.fillStyle = '#A0826D';
    ctx.fillRect(22 * scale, 26 * scale, 4 * scale, 3 * scale);
    ctx.fillRect(30 * scale, 38 * scale, 4 * scale, 4 * scale);

    // Arms (humanoid)
    ctx.fillStyle = '#5A7D4A';
    ctx.fillRect(2 * scale, 24 * scale, 8 * scale, 16 * scale);
    ctx.fillRect(40 * scale, 24 * scale, 8 * scale, 16 * scale);
    
    // Hands/claws
    ctx.fillStyle = '#4A5F3A';
    ctx.fillRect(2 * scale, 38 * scale, 8 * scale, 6 * scale);
    ctx.fillRect(40 * scale, 38 * scale, 8 * scale, 6 * scale);
    
    // Claw details
    ctx.fillStyle = '#FFFACD';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect((3 + i * 2) * scale, 42 * scale, 2 * scale, 2 * scale);
      ctx.fillRect((41 + i * 2) * scale, 42 * scale, 2 * scale, 2 * scale);
    }

    // Draw neck extension during bite attack
    if (this.attackType === 'bite' && this.attackState === 'attacking' && this.neckExtension > 5) {
      ctx.restore(); // Exit local transform
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      
      const baseX = this.x + this.width / 2;
      const baseY = this.y + this.height / 2 - 20;
      
      // Draw neck segments
      const neckSegments = 4;
      ctx.fillStyle = '#5A7D4A';
      for (let i = 0; i < neckSegments; i++) {
        const t = i / neckSegments;
        const segmentX = baseX + (this.headX - baseX) * t;
        const segmentY = baseY + (this.headY - baseY) * t;
        const segmentWidth = 16 - (i * 2);
        ctx.fillRect(segmentX - segmentWidth / 2, segmentY, segmentWidth, this.neckExtension / neckSegments + 2);
        
        // Belly on neck
        ctx.fillStyle = '#E8D4A0';
        ctx.fillRect(segmentX - (segmentWidth / 2 - 2), segmentY + 2, segmentWidth - 4, this.neckExtension / neckSegments - 2);
        ctx.fillStyle = '#5A7D4A';
      }
      
      ctx.restore();
      ctx.save();
      if (this.facingDirection === -1) {
        ctx.translate(this.x + this.width, this.y);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(this.x, this.y);
      }
    }

    // Head
    ctx.fillStyle = '#4A5F3A';
    ctx.fillRect(10 * scale, 4 * scale, 30 * scale, 18 * scale);
    
    // Snout
    ctx.fillStyle = '#5A7D4A';
    ctx.fillRect(34 * scale, 10 * scale, 16 * scale, 10 * scale);
    
    // Nostrils
    ctx.fillStyle = '#2A3F1A';
    ctx.fillRect(44 * scale, 12 * scale, 3 * scale, 3 * scale);
    ctx.fillRect(44 * scale, 16 * scale, 3 * scale, 3 * scale);

    // Eyes (red glowing)
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(18 * scale, 8 * scale, 6 * scale, 6 * scale);
    ctx.fillRect(28 * scale, 8 * scale, 6 * scale, 6 * scale);
    
    // Eye glow effect
    ctx.fillStyle = '#FF6666';
    ctx.fillRect(20 * scale, 10 * scale, 2 * scale, 2 * scale);
    ctx.fillRect(30 * scale, 10 * scale, 2 * scale, 2 * scale);

    // Mouth/Teeth
    const mouthOffset = (this.attackType === 'bite' && this.attackState === 'attacking') ? this.mouthOpen : 0;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(36 * scale, (18 + mouthOffset / 4) * scale, 12 * scale, (2 + mouthOffset / 2) * scale);
    
    // Teeth
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect((37 + i * 2) * scale, (18 + mouthOffset / 4) * scale, 2 * scale, 3 * scale);
      if (mouthOffset > 2) {
        ctx.fillRect((37 + i * 2) * scale, (20 + mouthOffset / 2) * scale, 2 * scale, 3 * scale);
      }
    }

    // Scales texture on body
    ctx.fillStyle = '#4A5F3A';
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 4; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect((10 + x * 6) * scale, (20 + y * 6) * scale, 4 * scale, 4 * scale);
        }
      }
    }

    ctx.restore();
    ctx.restore();
  }

  public checkPlayerCollision(playerX: number, playerY: number, playerSize: number): boolean {
    if (this.attackState !== 'attacking') {
      return false;
    }

    // Use head position for bite attacks with neck extension
    let checkX = this.x + this.width / 2;
    let checkY = this.y + this.height / 2;
    
    if (this.attackType === 'bite' && this.neckExtension > 5) {
      checkX = this.headX;
      checkY = this.headY;
    }

    const playerCenterX = playerX + playerSize / 2;
    const playerCenterY = playerY + playerSize / 2;

    const dx = playerCenterX - checkX;
    const dy = playerCenterY - checkY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < this.BITE_RANGE;
  }

  public checkSpitCollision(playerX: number, playerY: number, playerSize: number): boolean {
    const playerCenterX = playerX + playerSize / 2;
    const playerCenterY = playerY + playerSize / 2;

    for (const enemy of this.eatenEnemies) {
      const dx = playerCenterX - enemy.x;
      const dy = playerCenterY - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 30) {
        // Remove this projectile
        this.eatenEnemies = this.eatenEnemies.filter(e => e.id !== enemy.id);
        return true;
      }
    }

    return false;
  }

  public getPosition() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  public isIntroReady(): boolean {
    return !this.isIntroComplete;
  }

  public eatEnemy(enemyId: string): void {
    // Called externally when an enemy should be eaten
  }
}
