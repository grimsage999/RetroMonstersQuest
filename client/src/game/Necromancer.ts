/**
 * Necromancer - Evil witch mini-boss for Level 4.5
 * Can attack with broom melee and summon ghosts from graves
 */

import { Ghost } from './Ghost';

export interface TombstonePosition {
  x: number;
  y: number;
}

export type NecromancerAttackType = 'broom' | 'summon_ghost';

export class Necromancer {
  private x: number;
  private y: number;
  private readonly width: number = 48;
  private readonly height: number = 64;
  private tombstonePositions: TombstonePosition[];
  private ghosts: Ghost[] = [];
  private attackCooldown: number = 0;
  private attackType: NecromancerAttackType | null = null;
  private attackState: 'idle' | 'channeling' | 'attacking' | 'recovering' = 'idle';
  private stateTimer: number = 0;
  private audioManager: any;
  private cookieCount: number = 0;
  private totalCookies: number = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private animationFrame: number = 0;
  private animationTimer: number = 0;
  private broomSwingAngle: number = 0;
  private isIntroComplete: boolean = false;
  private idleTimer: number = 0;
  private breatheOffset: number = 0;
  private swayOffset: number = 0;
  private laughTimer: number = 0;
  private isLaughing: boolean = false;

  private readonly CHANNEL_DURATION = 1000; // 1 second warning
  private readonly ATTACK_DURATION = 600;
  private readonly RECOVERY_DURATION = 400;
  private readonly MELEE_RANGE = 100;
  private readonly BODY_COLLISION_RANGE = 35;

  constructor(x: number, y: number, tombstonePositions: TombstonePosition[], audioManager: any, totalCookies: number) {
    this.x = x;
    this.y = y;
    this.tombstonePositions = tombstonePositions;
    this.audioManager = audioManager;
    this.totalCookies = totalCookies;
    this.cookieCount = totalCookies;
  }

  public playIntroSequence(): void {
    this.playEvilLaugh();
    this.isIntroComplete = false;
  }

  public completeIntro(): void {
    this.isIntroComplete = true;
  }

  private playEvilLaugh(): void {
    if (this.audioManager && this.audioManager.playSound) {
      const audio = new Audio('/sounds/success.mp3');
      audio.playbackRate = 0.3;
      audio.volume = 0.7;
      audio.play().catch(() => {});
    }
  }

  private playGhostSummon(): void {
    if (this.audioManager && this.audioManager.playSound) {
      const audio = new Audio('/sounds/powerup.mp3');
      audio.playbackRate = 0.5;
      audio.volume = 0.6;
      audio.play().catch(() => {});
    }
  }

  private playBroomSwing(): void {
    if (this.audioManager && this.audioManager.playSound) {
      const audio = new Audio('/sounds/dash.mp3');
      audio.playbackRate = 0.8;
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }

  public updateCookieCount(cookiesCollected: number): void {
    this.cookieCount = this.totalCookies - cookiesCollected;
  }

  public updatePlayerPosition(playerX: number, playerY: number): void {
    this.playerX = playerX;
    this.playerY = playerY;
  }

  private getAttackCooldown(): number {
    const cookieRatio = this.cookieCount / this.totalCookies;
    
    if (cookieRatio > 0.7) {
      return 3500 + Math.random() * 1000;
    } else if (cookieRatio > 0.3) {
      return 2500 + Math.random() * 1000;
    } else {
      return 1500 + Math.random() * 1000;
    }
  }

  private getDistanceToPlayer(): number {
    const dx = this.playerX - this.x;
    const dy = this.playerY - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private selectAttackType(): NecromancerAttackType {
    const distance = this.getDistanceToPlayer();
    
    // If player is close, use broom melee
    if (distance < this.MELEE_RANGE) {
      return 'broom';
    }
    
    // Otherwise summon ghosts
    return 'summon_ghost';
  }

  private selectRandomTombstone(): TombstonePosition {
    const randomIndex = Math.floor(Math.random() * this.tombstonePositions.length);
    return this.tombstonePositions[randomIndex];
  }

  public update(deltaTime: number): void {
    if (!this.isIntroComplete) return;

    this.attackCooldown -= deltaTime;
    this.stateTimer += deltaTime;
    this.idleTimer += deltaTime;
    this.laughTimer += deltaTime;

    // Idle breathing and swaying animation
    this.breatheOffset = Math.sin(this.idleTimer * 0.002) * 2;
    this.swayOffset = Math.sin(this.idleTimer * 0.001) * 3;

    // Periodic laughing (every 8-15 seconds)
    if (this.laughTimer > 8000 + Math.random() * 7000) {
      this.isLaughing = true;
      this.playEvilLaugh();
      this.laughTimer = 0;
      setTimeout(() => {
        this.isLaughing = false;
      }, 1500);
    }

    // Update animation
    this.animationTimer += deltaTime;
    if (this.animationTimer > 300) {
      this.animationFrame = (this.animationFrame + 1) % 4;
      this.animationTimer = 0;
    }

    // Update all ghosts
    this.ghosts = this.ghosts.filter(ghost => {
      if (ghost.isActive()) {
        ghost.update(deltaTime, this.playerX, this.playerY);
        return true;
      }
      return false;
    });

    // State machine
    switch (this.attackState) {
      case 'idle':
        if (this.attackCooldown <= 0) {
          this.attackType = this.selectAttackType();
          this.attackState = 'channeling';
          this.stateTimer = 0;
          
          if (this.attackType === 'summon_ghost') {
            this.playGhostSummon();
          }
        }
        break;

      case 'channeling':
        if (this.stateTimer >= this.CHANNEL_DURATION) {
          this.attackState = 'attacking';
          this.stateTimer = 0;
          this.executeAttack();
        }
        break;

      case 'attacking':
        if (this.stateTimer >= this.ATTACK_DURATION) {
          this.attackState = 'recovering';
          this.stateTimer = 0;
        }
        break;

      case 'recovering':
        if (this.stateTimer >= this.RECOVERY_DURATION) {
          this.attackState = 'idle';
          this.attackCooldown = this.getAttackCooldown();
          this.attackType = null;
        }
        break;
    }

    // Update broom swing animation
    if (this.attackState === 'attacking' && this.attackType === 'broom') {
      const progress = this.stateTimer / this.ATTACK_DURATION;
      this.broomSwingAngle = Math.sin(progress * Math.PI) * Math.PI / 2;
    } else {
      this.broomSwingAngle = 0;
    }
  }

  private executeAttack(): void {
    if (this.attackType === 'broom') {
      this.playBroomSwing();
    } else if (this.attackType === 'summon_ghost') {
      // Summon 2-3 ghosts from random tombstones
      const ghostCount = 2 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < ghostCount; i++) {
        const tombstone = this.selectRandomTombstone();
        const ghost = new Ghost(tombstone.x, tombstone.y, this.playerX, this.playerY);
        this.ghosts.push(ghost);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Render all ghosts first (behind necromancer)
    this.ghosts.forEach(ghost => ghost.render(ctx));

    ctx.save();

    // Apply position with breathing and swaying
    const renderX = this.x + this.swayOffset;
    const renderY = this.y + this.breatheOffset;

    // Laughing visual effect (green evil glow)
    if (this.isLaughing) {
      const pulseAlpha = 0.3 + Math.sin(Date.now() * 0.02) * 0.2;
      ctx.globalAlpha = pulseAlpha;
      ctx.fillStyle = '#00FF00'; // Green evil aura when laughing
      ctx.beginPath();
      ctx.arc(renderX + this.width / 2, renderY + this.height / 2, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Channeling visual effect
    if (this.attackState === 'channeling' && this.attackType === 'summon_ghost') {
      const pulseAlpha = 0.3 + Math.sin(this.stateTimer * 0.01) * 0.2;
      ctx.globalAlpha = pulseAlpha;
      ctx.fillStyle = '#9370DB'; // Purple magic aura
      ctx.fillRect(renderX - 10, renderY - 10, this.width + 20, this.height + 20);
      ctx.globalAlpha = 1;
    }

    // Necromancer body (dark witch in flowing robes)

    // Flowing dark robe/dress
    ctx.fillStyle = '#1C1C1C'; // Black robe
    ctx.fillRect(renderX, renderY + 20, this.width, this.height - 20);
    
    // Purple accents on robe
    ctx.fillStyle = '#9370DB';
    ctx.fillRect(renderX + 8, renderY + 28, 8, this.height - 28);
    ctx.fillRect(renderX + this.width - 16, renderY + 28, 8, this.height - 28);

    // Witch hat (large pointed hat)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(renderX + this.width / 2, renderY - 20);
    ctx.lineTo(renderX + 8, renderY + 8);
    ctx.lineTo(renderX + this.width - 8, renderY + 8);
    ctx.closePath();
    ctx.fill();
    
    // Hat brim
    ctx.fillRect(renderX + 4, renderY + 8, this.width - 8, 4);
    
    // Purple band on hat
    ctx.fillStyle = '#9370DB';
    ctx.fillRect(renderX + 12, renderY + 4, this.width - 24, 4);

    // Head/face (pale greenish witch skin)
    ctx.fillStyle = '#8FBC8F';
    ctx.fillRect(renderX + 12, renderY + 12, this.width - 24, 16);

    // Glowing purple eyes (brighter when laughing)
    ctx.fillStyle = this.isLaughing ? '#00FF00' : '#FF00FF';
    ctx.fillRect(renderX + 16, renderY + 16, 4, 4);
    ctx.fillRect(renderX + 28, renderY + 16, 4, 4);

    // Evil grin (wider when laughing)
    ctx.fillStyle = '#000000';
    const mouthWidth = this.isLaughing ? 20 : 16;
    ctx.fillRect(renderX + 16 - (mouthWidth - 16) / 2, renderY + 24, mouthWidth, 2);

    // Arms/hands
    ctx.fillStyle = '#8FBC8F';
    ctx.fillRect(renderX + 4, renderY + 28, 8, 16);
    ctx.fillRect(renderX + this.width - 12, renderY + 28, 8, 16);

    // Broom (held in right hand)
    if (this.attackType === 'broom' && this.attackState === 'attacking') {
      ctx.save();
      ctx.translate(renderX + this.width - 8, renderY + 36);
      ctx.rotate(this.broomSwingAngle);
      
      // Broom handle
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-4, 0, 4, 40);
      
      // Broom bristles
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(-8, 36, 12, 8);
      
      ctx.restore();
    } else {
      // Broom at rest
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(renderX + this.width - 8, renderY + 36, 4, 32);
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(renderX + this.width - 12, renderY + 64, 12, 6);
    }

    ctx.restore();
  }

  public checkBroomCollision(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    if (this.attackState !== 'attacking' || this.attackType !== 'broom') {
      return false;
    }

    // Check if player is in melee range during broom attack
    const distance = this.getDistanceToPlayer();
    return distance < this.MELEE_RANGE;
  }

  public checkGhostCollisions(playerX: number, playerY: number, playerWidth: number, playerHeight: number): Ghost | null {
    for (const ghost of this.ghosts) {
      if (ghost.checkCollision(playerX, playerY, playerWidth, playerHeight)) {
        return ghost;
      }
    }
    return null;
  }

  public checkBodyCollision(playerX: number, playerY: number, playerSize: number): boolean {
    // Check if player touches the necromancer's body
    const necromancerCenterX = this.x + this.width / 2;
    const necromancerCenterY = this.y + this.height / 2;
    const playerCenterX = playerX + playerSize / 2;
    const playerCenterY = playerY + playerSize / 2;

    const dx = playerCenterX - necromancerCenterX;
    const dy = playerCenterY - necromancerCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < this.BODY_COLLISION_RANGE;
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  public getGhostCount(): number {
    return this.ghosts.filter(g => g.isActive()).length;
  }
}
