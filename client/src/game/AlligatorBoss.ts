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

  private readonly WARNING_DURATION = 1000;
  private readonly ATTACK_DURATION = 800;
  private readonly COOLDOWN_DURATION = 500;
  private readonly MOVE_SPEED = 2.5;
  private readonly BITE_RANGE = 80;
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
          // Lunge toward player
          const dx = this.playerX - (this.x + this.width / 2);
          const dy = this.playerY - (this.y + this.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            this.velocityX = (dx / distance) * this.MOVE_SPEED * 3;
            this.velocityY = (dy / distance) * this.MOVE_SPEED * 3;
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
        }
        break;

      case 'cooldown':
        this.velocityX *= 0.85;
        this.velocityY *= 0.85;
        
        if (this.stateTimer >= this.COOLDOWN_DURATION) {
          this.attackState = 'idle';
          this.stateTimer = 0;
          this.attackType = null;
          this.attackCooldown = this.getAttackCooldown();
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
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 40, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render alligator body
    ctx.save();
    if (this.facingDirection === -1) {
      ctx.translate(this.x + this.width, this.y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(this.x, this.y);
    }

    // Tank top (greasy look)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(10, 20, 40, 30);
    
    // Grease stains on tank top
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(15, 25, 8, 6);
    ctx.fillRect(28, 32, 10, 5);
    ctx.fillRect(20, 40, 7, 4);

    // Body
    ctx.fillStyle = '#5A7D4A';
    ctx.fillRect(5, 15, 50, 40);
    
    // Belly
    ctx.fillStyle = '#E8D4A0';
    ctx.fillRect(15, 25, 30, 25);

    // Head
    ctx.fillStyle = '#4A5F3A';
    ctx.fillRect(45, 10, 35, 30);
    
    // Eyes
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(52, 15, 8, 8);
    ctx.fillRect(65, 15, 8, 8);

    // Snout
    ctx.fillStyle = '#3A4F2A';
    ctx.fillRect(75, 20, 15, 15);

    // Mouth/Teeth (open during bite)
    if (this.attackType === 'bite' && this.attackState === 'attacking') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(75, 28 + this.mouthOpen / 2, 15, 3 + this.mouthOpen);
      
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(76 + i * 3, 28 + this.mouthOpen / 2, 2, 4);
        ctx.fillRect(76 + i * 3, 31 + this.mouthOpen, 2, 4);
      }
    }

    // Legs
    ctx.fillStyle = '#5A7D4A';
    ctx.fillRect(10, 50, 10, 15);
    ctx.fillRect(40, 50, 10, 15);

    ctx.restore();
    ctx.restore();
  }

  public checkPlayerCollision(playerX: number, playerY: number, playerSize: number): boolean {
    if (this.attackState !== 'attacking') {
      return false;
    }

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const playerCenterX = playerX + playerSize / 2;
    const playerCenterY = playerY + playerSize / 2;

    const dx = playerCenterX - centerX;
    const dy = playerCenterY - centerY;
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
