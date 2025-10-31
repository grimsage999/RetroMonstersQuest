/**
 * VoidLord - Final boss for Level 6
 * A terrifying cosmic entity that reigns over the void of space.
 * All attacks are instant-death. Stalks the player relentlessly.
 * Can breathe green and red fire, shoot eye lasers, and summon void ghosts.
 * Cannot be defeated directly - player must collect all cookies to win.
 */

import { Ghost } from './Ghost';

type AttackType = 'fire_breath_green' | 'fire_breath_red' | 'eye_laser' | 'summon_ghosts';
type VoidLordState = 'idle' | 'stalking' | 'warning' | 'attacking' | 'cooldown';

interface FireBreath {
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  speed: number;
  lifetime: number;
  maxLifetime: number;
  color: 'green' | 'red';
  size: number;
}

interface EyeLaser {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  warningTime: number;
  active: boolean;
  damage: boolean;
}

export class VoidLord {
  private x: number;
  private y: number;
  private readonly width: number = 120;
  private readonly height: number = 120;
  private velocityX: number = 0;
  private velocityY: number = 0;
  private state: VoidLordState = 'idle';
  private stateTimer: number = 0;
  private attackCooldown: number = 0;
  private currentAttack: AttackType | null = null;
  private audioManager: any;
  private cookieCount: number = 0;
  private totalCookies: number = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private isIntroComplete: boolean = false;
  
  // Visual effects
  private animationFrame: number = 0;
  private animationTimer: number = 0;
  private tentacleWave: number = 0;
  private eyeGlow: number = 0;
  private auraRotation: number = 0;
  
  // Attacks
  private fireBreaths: FireBreath[] = [];
  private eyeLasers: EyeLaser[] = [];
  private voidGhosts: Ghost[] = [];
  
  // Constants
  private readonly MOVE_SPEED = 2.0;
  private readonly STALK_DISTANCE = 150; // Keeps distance while stalking
  private readonly WARNING_DURATION = 1200;
  private readonly ATTACK_DURATION = 1500;
  private readonly COOLDOWN_DURATION = 800;
  private readonly MIN_ATTACK_COOLDOWN = 2000;
  private readonly MAX_ATTACK_COOLDOWN = 4000;

  constructor(audioManager: any, totalCookies: number, startX: number = 400, startY: number = 300) {
    this.audioManager = audioManager;
    this.totalCookies = totalCookies;
    this.cookieCount = totalCookies;
    this.x = startX;
    this.y = startY;
  }

  public playIntroSequence(): void {
    this.playVoidRoar();
    this.isIntroComplete = false;
  }

  public completeIntro(): void {
    this.isIntroComplete = true;
  }

  private playVoidRoar(): void {
    if (this.audioManager && this.audioManager.playSound) {
      const audio = new Audio('/sounds/success.mp3');
      audio.playbackRate = 0.2;
      audio.volume = 0.8;
      audio.play().catch(() => {});
    }
  }

  private playAttackSound(attackType: AttackType): void {
    if (!this.audioManager) return;
    
    const audio = new Audio('/sounds/success.mp3');
    switch (attackType) {
      case 'fire_breath_green':
      case 'fire_breath_red':
        audio.playbackRate = 0.4;
        audio.volume = 0.7;
        break;
      case 'eye_laser':
        audio.playbackRate = 0.8;
        audio.volume = 0.6;
        break;
      case 'summon_ghosts':
        audio.playbackRate = 0.3;
        audio.volume = 0.7;
        break;
    }
    audio.play().catch(() => {});
  }

  public updateCookieCount(cookiesCollected: number): void {
    this.cookieCount = this.totalCookies - cookiesCollected;
  }

  private chooseNextAttack(): AttackType {
    const attacks: AttackType[] = ['fire_breath_green', 'fire_breath_red', 'eye_laser', 'summon_ghosts'];
    
    // More aggressive as cookies are collected
    const cookieRatio = this.cookieCount / this.totalCookies;
    if (cookieRatio < 0.3) {
      // Final phase - more ghost summons and lasers
      return Math.random() < 0.6 ? 'summon_ghosts' : 'eye_laser';
    }
    
    return attacks[Math.floor(Math.random() * attacks.length)];
  }

  private getAttackCooldown(): number {
    const cookieRatio = this.cookieCount / this.totalCookies;
    
    // Attack faster as more cookies are collected
    if (cookieRatio < 0.3) {
      return this.MIN_ATTACK_COOLDOWN;
    } else if (cookieRatio < 0.6) {
      return this.MIN_ATTACK_COOLDOWN + (this.MAX_ATTACK_COOLDOWN - this.MIN_ATTACK_COOLDOWN) * 0.3;
    }
    return this.MIN_ATTACK_COOLDOWN + Math.random() * (this.MAX_ATTACK_COOLDOWN - this.MIN_ATTACK_COOLDOWN);
  }

  public update(deltaTime: number, playerX: number, playerY: number, canvasWidth: number, canvasHeight: number): void {
    if (!this.isIntroComplete) return;

    this.playerX = playerX;
    this.playerY = playerY;

    // Update visual effects
    this.animationTimer += deltaTime;
    if (this.animationTimer > 200) {
      this.animationFrame = (this.animationFrame + 1) % 8;
      this.animationTimer = 0;
    }
    this.tentacleWave += deltaTime * 0.003;
    this.eyeGlow = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
    this.auraRotation += deltaTime * 0.001;

    // Update state machine
    this.stateTimer += deltaTime;

    switch (this.state) {
      case 'idle':
        this.state = 'stalking';
        break;

      case 'stalking':
        this.stalkPlayer(deltaTime);
        
        if (this.attackCooldown <= 0) {
          this.currentAttack = this.chooseNextAttack();
          this.state = 'warning';
          this.stateTimer = 0;
        } else {
          this.attackCooldown -= deltaTime;
        }
        break;

      case 'warning':
        if (this.stateTimer >= this.WARNING_DURATION) {
          this.state = 'attacking';
          this.stateTimer = 0;
          this.executeAttack();
        }
        break;

      case 'attacking':
        if (this.stateTimer >= this.ATTACK_DURATION) {
          this.state = 'cooldown';
          this.stateTimer = 0;
        }
        break;

      case 'cooldown':
        if (this.stateTimer >= this.COOLDOWN_DURATION) {
          this.state = 'stalking';
          this.stateTimer = 0;
          this.attackCooldown = this.getAttackCooldown();
        }
        break;
    }

    // Update all active attacks
    this.updateFireBreaths(deltaTime, canvasWidth, canvasHeight);
    this.updateEyeLasers(deltaTime);
    this.updateVoidGhosts(deltaTime);
  }

  private stalkPlayer(deltaTime: number): void {
    const dx = this.playerX - this.x;
    const dy = this.playerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Move towards player but maintain stalking distance
    if (distance > this.STALK_DISTANCE) {
      const moveX = (dx / distance) * this.MOVE_SPEED;
      const moveY = (dy / distance) * this.MOVE_SPEED;
      this.x += moveX;
      this.y += moveY;
    } else if (distance < this.STALK_DISTANCE - 50) {
      // Back away slightly if too close
      const moveX = -(dx / distance) * this.MOVE_SPEED * 0.5;
      const moveY = -(dy / distance) * this.MOVE_SPEED * 0.5;
      this.x += moveX;
      this.y += moveY;
    }
  }

  private executeAttack(): void {
    if (!this.currentAttack) return;

    this.playAttackSound(this.currentAttack);

    switch (this.currentAttack) {
      case 'fire_breath_green':
        this.breathFire('green');
        break;
      case 'fire_breath_red':
        this.breathFire('red');
        break;
      case 'eye_laser':
        this.shootEyeLaser();
        break;
      case 'summon_ghosts':
        this.summonVoidGhosts();
        break;
    }
  }

  private breathFire(color: 'green' | 'red'): void {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    // Shoot multiple fire particles in a cone towards player
    const baseAngle = Math.atan2(this.playerY - centerY, this.playerX - centerX);
    const spreadCount = 5;
    const spreadAngle = Math.PI / 6; // 30 degree spread

    for (let i = 0; i < spreadCount; i++) {
      const angle = baseAngle + (i - spreadCount / 2) * (spreadAngle / spreadCount);
      this.fireBreaths.push({
        x: centerX,
        y: centerY,
        directionX: Math.cos(angle),
        directionY: Math.sin(angle),
        speed: 4 + Math.random() * 2,
        lifetime: 0,
        maxLifetime: 2000 + Math.random() * 1000,
        color: color,
        size: 12 + Math.random() * 8
      });
    }
  }

  private shootEyeLaser(): void {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2 - 20;
    
    // Shoot two lasers from each eye
    const eyeOffsets = [-25, 25];
    
    eyeOffsets.forEach(offsetX => {
      this.eyeLasers.push({
        startX: centerX + offsetX,
        startY: centerY,
        endX: this.playerX + 24,
        endY: this.playerY + 24,
        warningTime: 500,
        active: true,
        damage: false
      });
    });
  }

  private summonVoidGhosts(): void {
    // Summon 3-5 void ghosts around the arena
    const ghostCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < ghostCount; i++) {
      // Spawn ghosts in a circle around the Void Lord
      const angle = (Math.PI * 2 * i) / ghostCount;
      const spawnDistance = 150;
      const spawnX = this.x + Math.cos(angle) * spawnDistance;
      const spawnY = this.y + Math.sin(angle) * spawnDistance;
      
      this.voidGhosts.push(new Ghost(spawnX, spawnY, this.playerX, this.playerY));
    }
  }

  private updateFireBreaths(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    this.fireBreaths = this.fireBreaths.filter(fire => {
      fire.lifetime += deltaTime;
      
      if (fire.lifetime >= fire.maxLifetime) {
        return false;
      }

      fire.x += fire.directionX * fire.speed;
      fire.y += fire.directionY * fire.speed;

      // Remove if off-screen
      if (fire.x < -50 || fire.x > canvasWidth + 50 || fire.y < -50 || fire.y > canvasHeight + 50) {
        return false;
      }

      return true;
    });
  }

  private updateEyeLasers(deltaTime: number): void {
    this.eyeLasers = this.eyeLasers.filter(laser => {
      if (!laser.active) return false;

      laser.warningTime -= deltaTime;

      // Activate damage after warning period
      if (laser.warningTime <= 0 && !laser.damage) {
        laser.damage = true;
      }

      // Deactivate after being active for a short time
      if (laser.damage && laser.warningTime < -300) {
        laser.active = false;
        return false;
      }

      return true;
    });
  }

  private updateVoidGhosts(deltaTime: number): void {
    this.voidGhosts.forEach(ghost => {
      ghost.update(deltaTime, this.playerX + 24, this.playerY + 24);
    });
    
    // Remove inactive ghosts
    this.voidGhosts = this.voidGhosts.filter(ghost => ghost.isActive());
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isIntroComplete) return;

    ctx.save();

    // Cosmic aura
    this.renderCosmicAura(ctx);

    // Main body with tentacles
    this.renderBody(ctx);

    // Eyes with glow
    this.renderEyes(ctx);

    // Render active attacks
    this.renderFireBreaths(ctx);
    this.renderEyeLasers(ctx);
    this.renderVoidGhosts(ctx);

    // Warning indicator during warning state
    if (this.state === 'warning') {
      this.renderWarningIndicator(ctx);
    }

    ctx.restore();
  }

  private renderCosmicAura(ctx: CanvasRenderingContext2D): void {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Outer purple aura
    const gradient = ctx.createRadialGradient(centerX, centerY, 40, centerX, centerY, 100);
    gradient.addColorStop(0, 'rgba(138, 43, 226, 0.3)');
    gradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.2)');
    gradient.addColorStop(1, 'rgba(75, 0, 130, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
    ctx.fill();

    // Rotating energy particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + this.auraRotation;
      const distance = 70 + Math.sin(this.tentacleWave + i) * 10;
      const px = centerX + Math.cos(angle) * distance;
      const py = centerY + Math.sin(angle) * distance;
      
      ctx.fillStyle = '#8A2BE2';
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderBody(ctx: CanvasRenderingContext2D): void {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Tentacles with wave animation
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const waveOffset = Math.sin(this.tentacleWave + i * 0.5) * 15;
      const tentacleLength = 50 + waveOffset;
      
      ctx.strokeStyle = '#4B0082';
      ctx.lineWidth = 6;
      ctx.globalAlpha = 0.8;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      
      const endX = centerX + Math.cos(angle) * tentacleLength;
      const endY = centerY + Math.sin(angle) * tentacleLength;
      const controlX = centerX + Math.cos(angle + 0.3) * (tentacleLength * 0.7);
      const controlY = centerY + Math.sin(angle + 0.3) * (tentacleLength * 0.7);
      
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      ctx.stroke();
      
      // Tentacle tips
      ctx.fillStyle = '#8A2BE2';
      ctx.beginPath();
      ctx.arc(endX, endY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Main head/body - cosmic purple
    ctx.fillStyle = '#4B0082';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 45, 0, Math.PI * 2);
    ctx.fill();

    // Darker inner core
    ctx.fillStyle = '#2E0854';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
    ctx.fill();

    // Cosmic details/spots
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 25 + Math.random() * 10;
      const spotX = centerX + Math.cos(angle) * distance;
      const spotY = centerY + Math.sin(angle) * distance;
      
      ctx.fillStyle = '#8A2BE2';
      ctx.globalAlpha = 0.4 + Math.random() * 0.3;
      ctx.beginPath();
      ctx.arc(spotX, spotY, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderEyes(ctx: CanvasRenderingContext2D): void {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2 - 10;

    // Eye positions
    const eyePositions = [
      { x: centerX - 20, y: centerY },
      { x: centerX + 20, y: centerY }
    ];

    eyePositions.forEach(eye => {
      // Glowing red eye socket
      const gradient = ctx.createRadialGradient(eye.x, eye.y, 5, eye.x, eye.y, 15);
      gradient.addColorStop(0, `rgba(255, 0, 0, ${this.eyeGlow})`);
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, 15, 0, Math.PI * 2);
      ctx.fill();

      // Eye itself
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Eye highlight
      ctx.fillStyle = '#FF6666';
      ctx.beginPath();
      ctx.arc(eye.x - 2, eye.y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private renderWarningIndicator(ctx: CanvasRenderingContext2D): void {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Pulsing warning circle
    const pulseAlpha = Math.sin(this.stateTimer * 0.01) * 0.3 + 0.5;
    ctx.strokeStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60 + Math.sin(this.stateTimer * 0.01) * 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  private renderFireBreaths(ctx: CanvasRenderingContext2D): void {
    this.fireBreaths.forEach(fire => {
      const alpha = 1 - (fire.lifetime / fire.maxLifetime);
      const color = fire.color === 'green' ? '0, 255, 0' : '255, 0, 0';
      
      // Outer glow
      const gradient = ctx.createRadialGradient(fire.x, fire.y, 0, fire.x, fire.y, fire.size);
      gradient.addColorStop(0, `rgba(${color}, ${alpha * 0.9})`);
      gradient.addColorStop(0.5, `rgba(${color}, ${alpha * 0.5})`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(fire.x, fire.y, fire.size, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(fire.x, fire.y, fire.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private renderEyeLasers(ctx: CanvasRenderingContext2D): void {
    this.eyeLasers.forEach(laser => {
      if (laser.warningTime > 0) {
        // Warning phase - show targeting line
        ctx.strokeStyle = `rgba(255, 255, 0, ${0.3 + Math.sin(Date.now() * 0.02) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(laser.startX, laser.startY);
        ctx.lineTo(laser.endX, laser.endY);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (laser.damage) {
        // Damage phase - show deadly laser
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
        ctx.lineWidth = 8;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(laser.startX, laser.startY);
        ctx.lineTo(laser.endX, laser.endY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner bright core
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(laser.startX, laser.startY);
        ctx.lineTo(laser.endX, laser.endY);
        ctx.stroke();
      }
    });
  }

  private renderVoidGhosts(ctx: CanvasRenderingContext2D): void {
    this.voidGhosts.forEach(ghost => {
      ghost.render(ctx);
    });
  }

  public checkPlayerCollision(playerX: number, playerY: number, playerSize: number): boolean {
    // Check body collision
    if (this.checkBodyCollision(playerX, playerY, playerSize)) {
      return true;
    }

    // Check fire breath collisions
    for (const fire of this.fireBreaths) {
      const playerCenterX = playerX + playerSize / 2;
      const playerCenterY = playerY + playerSize / 2;
      const dx = fire.x - playerCenterX;
      const dy = fire.y - playerCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < fire.size + playerSize / 2) {
        return true; // Instant death
      }
    }

    // Check eye laser collisions (only when damage is active)
    for (const laser of this.eyeLasers) {
      if (laser.damage && this.checkLaserCollision(laser, playerX, playerY, playerSize)) {
        return true; // Instant death
      }
    }

    // Check void ghost collisions
    for (const ghost of this.voidGhosts) {
      if (ghost.checkCollision(playerX, playerY, playerSize, playerSize)) {
        return true; // Instant death
      }
    }

    return false;
  }

  private checkBodyCollision(playerX: number, playerY: number, playerSize: number): boolean {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const playerCenterX = playerX + playerSize / 2;
    const playerCenterY = playerY + playerSize / 2;

    const dx = playerCenterX - centerX;
    const dy = playerCenterY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < 50 + playerSize / 2;
  }

  private checkLaserCollision(laser: EyeLaser, playerX: number, playerY: number, playerSize: number): boolean {
    const playerCenterX = playerX + playerSize / 2;
    const playerCenterY = playerY + playerSize / 2;

    // Point to line segment distance
    const A = playerCenterX - laser.startX;
    const B = playerCenterY - laser.startY;
    const C = laser.endX - laser.startX;
    const D = laser.endY - laser.startY;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;

    let xx, yy;

    if (param < 0) {
      xx = laser.startX;
      yy = laser.startY;
    } else if (param > 1) {
      xx = laser.endX;
      yy = laser.endY;
    } else {
      xx = laser.startX + param * C;
      yy = laser.startY + param * D;
    }

    const dx = playerCenterX - xx;
    const dy = playerCenterY - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < 20; // Laser hit radius
  }

  public getPosition() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  public isIntroReady(): boolean {
    return !this.isIntroComplete;
  }

  public getActiveGhostCount(): number {
    return this.voidGhosts.filter(g => g.isActive()).length;
  }
}
