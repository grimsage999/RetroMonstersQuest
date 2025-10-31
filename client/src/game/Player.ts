
// Sprite constants for better organization
class PlayerSpriteColors {
  static readonly COSMO_PALETTE = [
    'transparent',  // 0 - transparent
    '#2D5016',      // 1 - dark green outline
    '#39FF14',      // 2 - bright alien green
    '#000000',      // 3 - black eyes
    '#FFFFFF',      // 4 - white eye highlights
    '#228B22',      // 5 - medium green
    '#32CD32',      // 6 - lime green details
    '#FFD700',      // 7 - golden details
  ];
  
  static readonly SPRITE_SCALE = 3;
}


import { InputManager } from './InputManager';
import { MovementSystem } from './MovementSystem';
import { BubbleShield } from './BubbleShield';
import { logger } from './Logger';

export class Player {
  private x: number;
  private y: number;
  private width: number = 48; // 16 * 3 scale
  private height: number = 48; // 16 * 3 scale
  private speed: number = 8; // Increased speed for better gameplay
  private isMoving: boolean = false;
  private direction: string = 'right';
  private animationFrame: number = 0;
  private animationTimer: number = 0;
  private movementSystem: MovementSystem;
  private screenShakeX: number = 0;
  private screenShakeY: number = 0;
  
  // Enhanced animation properties for squash & stretch
  private scaleX: number = 1;
  private scaleY: number = 1;
  private animationState: 'idle' | 'walking' | 'dashing' | 'starting' | 'stopping' | 'teleporting' = 'idle';
  private stateTimer: number = 0;
  private previousSpeed: number = 0;
  
  // Teleport system
  private teleportCooldown: number = 3000; // 3 second cooldown in ms (random teleport is powerful)
  private teleportCooldownTimer: number = 0;
  private isTeleporting: boolean = false;
  private teleportAnimationTimer: number = 0;
  private teleportAnimationDuration: number = 600; // 600ms for teleport animation (longer for dramatic effect)
  private teleportStartX: number = 0;
  private teleportStartY: number = 0;
  private teleportPhase: 'fadeOut' | 'fadeIn' = 'fadeOut';
  
  // Weapon X - Bubble Shield system
  private weaponXUnlocked: boolean = false;
  private bubbleShield: BubbleShield;
  private weaponXMessageTimer: number = 0;
  private weaponXMessageDuration: number = 3000; // Show message for 3 seconds
  private previousXKeyState: boolean = false; // Track previous key state to detect press (not hold)

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.movementSystem = new MovementSystem();
    this.bubbleShield = new BubbleShield();
    // Configure for faster, more responsive gameplay
    this.movementSystem.configure({
      baseSpeed: 6,
      maxSpeed: 8,
      acceleration: 0.35,
      deceleration: 0.2,
      dashSpeed: 18, // Dramatic burst! 2.25x faster than running
      dashDuration: 120, // Slightly longer for better perception
      dashCooldown: 800 // 0.8 seconds to prevent spam
    });
  }

  public update(inputManager: InputManager, deltaTime: number, canvasWidth: number, canvasHeight: number) {
    // Update Weapon X message timer
    if (this.weaponXMessageTimer > 0) {
      this.weaponXMessageTimer -= deltaTime;
      if (this.weaponXMessageTimer < 0) {
        this.weaponXMessageTimer = 0;
      }
    }
    
    // Update bubble shield
    this.bubbleShield.update(deltaTime);
    
    // Update teleport cooldown
    if (this.teleportCooldownTimer > 0) {
      this.teleportCooldownTimer -= deltaTime;
    }
    
    // Update teleport animation
    if (this.isTeleporting) {
      this.teleportAnimationTimer -= deltaTime;
      if (this.teleportAnimationTimer <= 0) {
        this.isTeleporting = false;
        this.animationState = 'idle';
      }
      // Don't process other inputs during teleport animation
      return;
    }
    
    // Check for Weapon X bubble shield activation (X key) - only on key press, not hold
    const isXPressed = inputManager.isKeyPressed('x') || inputManager.isKeyPressed('X');
    const isXJustPressed = isXPressed && !this.previousXKeyState;
    this.previousXKeyState = isXPressed;
    
    if (isXJustPressed && this.weaponXUnlocked) {
      const activated = this.bubbleShield.activate();
      if (!activated) {
        // Only log if it failed due to cooldown (not spam the console)
        if (this.bubbleShield.isOnCooldown()) {
          logger.debug(`🛡️ Bubble Shield on cooldown: ${(this.bubbleShield.getCooldownPercent() * 100).toFixed(0)}% remaining`);
        }
      }
    }
    
    // Get input direction
    let inputX = 0;
    let inputY = 0;
    
    if (inputManager.isKeyPressed('ArrowUp')) inputY = -1;
    if (inputManager.isKeyPressed('ArrowDown')) inputY = 1;
    if (inputManager.isKeyPressed('ArrowLeft')) {
      inputX = -1;
      this.direction = 'left';
    }
    if (inputManager.isKeyPressed('ArrowRight')) {
      inputX = 1;
      this.direction = 'right';
    }
    
    // Check for teleport input (Spacebar)
    const isTeleportPressed = inputManager.isKeyPressed(' ') || inputManager.isKeyPressed('Space');
    if (isTeleportPressed && this.teleportCooldownTimer <= 0 && !this.isTeleporting) {
      this.activateTeleport(inputX, inputY, canvasWidth, canvasHeight);
      return; // Skip normal movement this frame
    }
    
    // Check for dash input (Shift key - either left or right)
    const isDashPressed = inputManager.isKeyPressed('ShiftLeft') || inputManager.isKeyPressed('ShiftRight') || inputManager.isKeyPressed('Shift');
    
    // Get movement from movement system
    const movement = this.movementSystem.update(inputX, inputY, isDashPressed, deltaTime);
    
    // Apply movement
    // Sanitize movement to prevent NaN/Infinity crashes
    const safeDx = Number.isFinite(movement.dx) ? movement.dx : 0;
    const safeDy = Number.isFinite(movement.dy) ? movement.dy : 0;
    
    this.x += safeDx;
    this.y += safeDy;
    
    // Keep player within bounds
    this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
    this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
    
    // Enhanced animation system with squash & stretch
    const state = this.movementSystem.getState();
    this.isMoving = state.speed > 0.5;
    
    // Update animation state and timer
    this.stateTimer += deltaTime;
    this.updateAnimationState(state, deltaTime);
    this.updateSquashAndStretch(state, deltaTime);
    
    // Update animation frames based on state
    this.updateAnimationFrames(state, deltaTime);
    
    this.previousSpeed = state.speed;
  }
  
  private activateTeleport(inputX: number, inputY: number, canvasWidth: number, canvasHeight: number) {
    // Store start position for visual effect
    this.teleportStartX = this.x;
    this.teleportStartY = this.y;
    
    // Generate random position anywhere on the map
    // Add margin to avoid spawning too close to edges
    const margin = 50;
    const targetX = margin + Math.random() * (canvasWidth - this.width - margin * 2);
    const targetY = margin + Math.random() * (canvasHeight - this.height - margin * 2);
    
    // Set teleport state - start with fade out phase
    this.isTeleporting = true;
    this.teleportAnimationTimer = this.teleportAnimationDuration;
    this.teleportCooldownTimer = this.teleportCooldown;
    this.animationState = 'teleporting';
    this.teleportPhase = 'fadeOut';
    
    // Actually move player at halfway point of animation
    const halfwayDelay = this.teleportAnimationDuration / 2;
    setTimeout(() => {
      if (this.isTeleporting) {
        this.x = targetX;
        this.y = targetY;
        this.teleportPhase = 'fadeIn';
      }
    }, halfwayDelay);
    
    logger.info(`✨ TELEPORT ACTIVATED! From (${Math.round(this.teleportStartX)}, ${Math.round(this.teleportStartY)}) to (${Math.round(targetX)}, ${Math.round(targetY)})`);
  }

  public render(ctx: CanvasRenderingContext2D) {
    const state = this.movementSystem.getState();
    
    // Draw teleport effect if teleporting
    if (this.isTeleporting) {
      this.renderTeleportEffect(ctx);
    }
    
    // Draw bubble shield first (so it appears behind player)
    this.bubbleShield.render(ctx, this.x, this.y);
    
    // Draw dash trail effect if dashing
    if (state.isDashing) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      
      // Draw 2 afterimages behind the player using dash direction
      for (let i = 1; i <= 2; i++) {
        const trailOffset = i * 12; // Pixels behind
        // Position trail opposite to dash direction
        const trailX = this.x - (state.dashDirectionX * trailOffset);
        const trailY = this.y - (state.dashDirectionY * trailOffset);
        
        ctx.fillStyle = '#39FF14'; // Bright alien green
        ctx.fillRect(trailX, trailY, this.width, this.height);
      }
      ctx.restore();
    }
    
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    // Apply teleport fade effect
    if (this.isTeleporting) {
      const progress = 1 - (this.teleportAnimationTimer / this.teleportAnimationDuration);
      if (this.teleportPhase === 'fadeOut') {
        // Fade out during first half
        ctx.globalAlpha = 1 - (progress * 2);
      } else {
        // Fade in during second half
        ctx.globalAlpha = (progress - 0.5) * 2;
      }
    }
    
    // Apply squash & stretch transformation
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    ctx.translate(centerX, centerY);
    ctx.scale(this.scaleX, this.scaleY);
    
    // Flip sprite for left direction
    if (this.direction === 'left') {
      ctx.scale(-1, 1);
    }
    
    ctx.translate(-this.width / 2, -this.height / 2);
    
    const spritePixels = this.getCurrentSpriteFrame();
    this.renderSpriteTransformed(ctx, spritePixels);
    
    ctx.restore();
    
    // Render Weapon X unlock message
    if (this.weaponXMessageTimer > 0) {
      this.renderWeaponXMessage(ctx);
    }
  }

  private getCurrentSpriteFrame(): number[][] {
    switch (this.animationState) {
      case 'idle':
      case 'stopping':
        return this.getIdleFrame();
      case 'starting':
        return this.getStartFrame();
      case 'walking':
      case 'dashing':
        // Enhanced 3-frame walk cycle
        if (this.animationFrame === 0) return this.getWalkFrame1();
        if (this.animationFrame === 1) return this.getWalkFrame2();
        return this.getWalkFrame3();
      default:
        return this.getIdleFrame();
    }
  }

  private renderSpriteTransformed(ctx: CanvasRenderingContext2D, spritePixels: number[][]) {
    const colors = PlayerSpriteColors.COSMO_PALETTE;
    const scale = PlayerSpriteColors.SPRITE_SCALE;
    
    for (let row = 0; row < spritePixels.length; row++) {
      for (let col = 0; col < spritePixels[row].length; col++) {
        const colorIndex = spritePixels[row][col];
        if (colorIndex > 0) {
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(
            col * scale, 
            row * scale, 
            scale, 
            scale
          );
        }
      }
    }
  }
  
  private updateAnimationState(state: any, deltaTime: number) {
    const wasMoving = this.previousSpeed > 0.5;
    const isMoving = state.speed > 0.5;
    
    // State transitions
    if (!wasMoving && isMoving) {
      this.animationState = 'starting';
      this.stateTimer = 0;
    } else if (wasMoving && !isMoving) {
      this.animationState = 'stopping';
      this.stateTimer = 0;
    } else if (state.isDashing) {
      this.animationState = 'dashing';
    } else if (isMoving) {
      if (this.animationState === 'starting' && this.stateTimer > 200) {
        this.animationState = 'walking';
      } else if (this.animationState !== 'starting') {
        this.animationState = 'walking';
      }
    } else {
      if (this.animationState === 'stopping' && this.stateTimer > 300) {
        this.animationState = 'idle';
      } else if (this.animationState !== 'stopping') {
        this.animationState = 'idle';
      }
    }
  }
  
  private updateSquashAndStretch(state: any, deltaTime: number) {
    // Squash & stretch based on animation state
    const targetScaleX = 1;
    let targetScaleY = 1;
    
    switch (this.animationState) {
      case 'starting':
        // Squash down when starting movement
        targetScaleY = 0.8;
        break;
      case 'dashing':
        // Stretch horizontally when dashing
        const stretchX = 1.2;
        const stretchY = 0.9;
        this.scaleX = this.lerp(this.scaleX, stretchX, deltaTime * 0.01);
        this.scaleY = this.lerp(this.scaleY, stretchY, deltaTime * 0.01);
        return;
      case 'stopping':
        // Stretch up when stopping
        targetScaleY = 1.1;
        break;
      case 'walking':
        // Slight bob effect while walking
        const bobAmount = Math.sin(this.animationTimer * 0.01) * 0.05;
        targetScaleY = 1 + bobAmount;
        break;
      case 'idle':
      default:
        // Return to normal
        targetScaleY = 1;
        break;
    }
    
    // Smooth interpolation to target scale
    const lerpSpeed = deltaTime * 0.008;
    this.scaleX = this.lerp(this.scaleX, targetScaleX, lerpSpeed);
    this.scaleY = this.lerp(this.scaleY, targetScaleY, lerpSpeed);
  }
  
  private updateAnimationFrames(state: any, deltaTime: number) {
    if (this.animationState === 'walking' || this.animationState === 'dashing') {
      // Speed up animation when dashing
      const animSpeed = this.animationState === 'dashing' ? 120 : 250;
      this.animationTimer += deltaTime;
      if (this.animationTimer > animSpeed) {
        this.animationFrame = (this.animationFrame + 1) % 3; // 3-frame cycle for more fluid movement
        this.animationTimer = 0;
      }
    } else {
      this.animationFrame = 0;
      this.animationTimer = 0;
    }
  }
  
  private lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * Math.min(factor, 1);
  }

  private getIdleFrame() {
    // Cosmo idle pose (16x16) - classic "little green man"
    return [
      [0,0,0,0,2,2,2,2,2,2,0,0,0,0,0,0], // Row 0 - head top
      [0,0,2,2,2,2,2,2,2,2,2,2,0,0,0,0], // Row 1 - head
      [0,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0], // Row 2 - head wide
      [2,2,2,3,3,2,2,2,2,3,3,2,2,2,0,0], // Row 3 - eyes
      [2,2,3,4,4,3,2,2,3,4,4,3,2,2,0,0], // Row 4 - eye details
      [2,2,2,3,3,2,2,2,2,3,3,2,2,2,0,0], // Row 5 - eyes
      [2,2,2,2,2,2,1,1,2,2,2,2,2,2,0,0], // Row 6 - nose
      [0,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0], // Row 7 - face
      [0,0,2,2,2,2,2,2,2,2,2,2,0,0,0,0], // Row 8 - neck
      [0,0,0,5,5,5,5,5,5,5,5,0,0,0,0,0], // Row 9 - body top
      [0,0,5,5,5,5,5,5,5,5,5,5,0,0,0,0], // Row 10 - body
      [0,0,5,5,5,5,5,5,5,5,5,5,0,0,0,0], // Row 11 - body
      [0,0,0,5,5,5,5,5,5,5,5,0,0,0,0,0], // Row 12 - body bottom
      [0,0,0,0,2,2,0,0,2,2,0,0,0,0,0,0], // Row 13 - legs
      [0,0,0,2,2,2,0,0,2,2,2,0,0,0,0,0], // Row 14 - feet
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Row 15
    ];
  }

  private getWalkFrame1() {
    // Cosmo walk frame 1 - left leg forward
    return [
      [0,0,0,0,2,2,2,2,2,2,0,0,0,0,0,0], // Row 0
      [0,0,2,2,2,2,2,2,2,2,2,2,0,0,0,0], // Row 1
      [0,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0], // Row 2
      [2,2,2,3,3,2,2,2,2,3,3,2,2,2,0,0], // Row 3
      [2,2,3,4,4,3,2,2,3,4,4,3,2,2,0,0], // Row 4
      [2,2,2,3,3,2,2,2,2,3,3,2,2,2,0,0], // Row 5
      [2,2,2,2,2,2,1,1,2,2,2,2,2,2,0,0], // Row 6
      [0,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0], // Row 7
      [0,0,2,2,2,2,2,2,2,2,2,2,0,0,0,0], // Row 8
      [0,0,0,5,5,5,5,5,5,5,5,0,0,0,0,0], // Row 9
      [0,0,5,5,5,5,5,5,5,5,5,5,0,0,0,0], // Row 10
      [0,0,5,5,5,5,5,5,5,5,5,5,0,0,0,0], // Row 11
      [0,0,0,5,5,5,5,5,5,5,5,0,0,0,0,0], // Row 12
      [0,0,2,2,2,0,0,0,2,2,0,0,0,0,0,0], // Row 13 - left leg forward
      [0,2,2,2,2,0,0,0,2,2,2,0,0,0,0,0], // Row 14
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Row 15
    ];
  }

  private getWalkFrame2() {
    // Cosmo walk frame 2 - right leg forward
    return [
      [0,0,0,0,2,2,2,2,2,2,0,0,0,0,0,0], // Row 0
      [0,0,2,2,2,2,2,2,2,2,2,2,0,0,0,0], // Row 1
      [0,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0], // Row 2
      [2,2,2,3,3,2,2,2,2,3,3,2,2,2,0,0], // Row 3
      [2,2,3,4,4,3,2,2,3,4,4,3,2,2,0,0], // Row 4
      [2,2,2,3,3,2,2,2,2,3,3,2,2,2,0,0], // Row 5
      [2,2,2,2,2,2,1,1,2,2,2,2,2,2,0,0], // Row 6
      [0,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0], // Row 7
      [0,0,2,2,2,2,2,2,2,2,2,2,0,0,0,0], // Row 8
      [0,0,0,5,5,5,5,5,5,5,5,0,0,0,0,0], // Row 9
      [0,0,5,5,5,5,5,5,5,5,5,5,0,0,0,0], // Row 10
      [0,0,5,5,5,5,5,5,5,5,5,5,0,0,0,0], // Row 11
      [0,0,0,5,5,5,5,5,5,5,5,0,0,0,0,0], // Row 12
      [0,0,0,2,2,0,0,2,2,2,0,0,0,0,0,0], // Row 13 - right leg forward
      [0,0,0,2,2,2,0,2,2,2,2,0,0,0,0,0], // Row 14
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Row 15
    ];
  }
  
  private getStartFrame() {
    // Cosmo starting movement - squashed pose for anticipation
    return [
      [0,0,0,0,2,2,2,2,2,2,0,0,0,0,0,0], // Row 0 - head
      [0,0,2,2,2,2,2,2,2,2,2,2,0,0,0,0], // Row 1
      [0,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0], // Row 2
      [2,2,2,3,3,2,2,2,2,3,3,2,2,2,0,0], // Row 3 - focused eyes
      [2,2,3,4,4,3,2,2,3,4,4,3,2,2,0,0], // Row 4
      [2,2,2,3,3,2,2,2,2,3,3,2,2,2,0,0], // Row 5
      [2,2,2,2,2,2,1,1,2,2,2,2,2,2,0,0], // Row 6
      [0,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0], // Row 7
      [0,0,2,2,2,2,2,2,2,2,2,2,0,0,0,0], // Row 8
      [0,0,0,5,5,5,5,5,5,5,5,0,0,0,0,0], // Row 9 - body compressed
      [0,0,5,5,5,5,5,5,5,5,5,5,0,0,0,0], // Row 10
      [0,0,5,5,5,5,5,5,5,5,5,5,0,0,0,0], // Row 11
      [0,0,5,5,5,5,5,5,5,5,5,5,0,0,0,0], // Row 12 - wider for squash effect
      [0,0,0,2,2,0,0,0,2,2,0,0,0,0,0,0], // Row 13 - legs ready
      [0,0,2,2,2,2,0,2,2,2,2,0,0,0,0,0], // Row 14
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Row 15
    ];
  }
  
  private getWalkFrame3() {
    // Cosmo walk frame 3 - mid-stride dynamic pose
    return [
      [0,0,0,0,2,2,2,2,2,2,0,0,0,0,0,0], // Row 0
      [0,0,2,2,2,2,2,2,2,2,2,2,0,0,0,0], // Row 1
      [0,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0], // Row 2
      [2,2,2,3,3,2,2,2,2,3,3,2,2,2,0,0], // Row 3
      [2,2,3,4,4,3,2,2,3,4,4,3,2,2,0,0], // Row 4
      [2,2,2,3,3,2,2,2,2,3,3,2,2,2,0,0], // Row 5
      [2,2,2,2,2,2,1,1,2,2,2,2,2,2,0,0], // Row 6
      [0,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0], // Row 7
      [0,0,2,2,2,2,2,2,2,2,2,2,0,0,0,0], // Row 8
      [0,0,0,5,5,5,5,5,5,5,5,0,0,0,0,0], // Row 9
      [0,0,5,5,5,5,5,5,5,5,5,5,0,0,0,0], // Row 10
      [0,0,5,5,5,5,5,5,5,5,5,5,0,0,0,0], // Row 11
      [0,0,0,5,5,5,5,5,5,5,5,0,0,0,0,0], // Row 12
      [0,0,0,0,2,2,2,2,2,0,0,0,0,0,0,0], // Row 13 - both legs center
      [0,0,0,2,2,2,2,2,2,2,0,0,0,0,0,0], // Row 14
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Row 15
    ];
  }

  public getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public isDashing(): boolean {
    return this.movementSystem.getState().isDashing;
  }

  public canDash(): boolean {
    return this.movementSystem.getState().canDash;
  }
  
  public isTeleportingNow(): boolean {
    return this.isTeleporting;
  }
  
  public canTeleport(): boolean {
    return this.teleportCooldownTimer <= 0 && !this.isTeleporting;
  }
  
  public getTeleportCooldown(): number {
    return Math.max(0, this.teleportCooldownTimer);
  }
  
  public getTeleportCooldownPercent(): number {
    return Math.max(0, Math.min(1, this.teleportCooldownTimer / this.teleportCooldown));
  }
  
  private renderTeleportEffect(ctx: CanvasRenderingContext2D) {
    // Calculate animation progress (0 = start, 1 = end)
    const progress = 1 - (this.teleportAnimationTimer / this.teleportAnimationDuration);
    const phaseProgress = this.teleportPhase === 'fadeOut' ? progress * 2 : (progress - 0.5) * 2;
    
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    ctx.save();
    
    // PORTAL EFFECT - Large expanding/contracting portal
    const portalMaxRadius = 120;
    const portalRadius = this.teleportPhase === 'fadeOut' 
      ? portalMaxRadius * phaseProgress 
      : portalMaxRadius * (1 - phaseProgress);
    
    // Portal outer glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, portalRadius);
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - portalRadius, centerY - portalRadius, portalRadius * 2, portalRadius * 2);
    
    // Multiple spinning portal rings
    const numPortalRings = 6;
    for (let i = 0; i < numPortalRings; i++) {
      const ringRadius = portalRadius * (0.3 + (i / numPortalRings) * 0.7);
      const ringAlpha = 0.8 - (i / numPortalRings) * 0.5;
      
      ctx.strokeStyle = `rgba(0, 255, 255, ${ringAlpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Inner purple ring for depth
      ctx.strokeStyle = `rgba(138, 43, 226, ${ringAlpha * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // ENERGY BEAMS shooting outward
    const beamCount = 16;
    for (let i = 0; i < beamCount; i++) {
      const angle = (i / beamCount) * Math.PI * 2 + progress * Math.PI;
      const beamLength = portalRadius * 1.5;
      const startDist = 20;
      
      const x1 = centerX + Math.cos(angle) * startDist;
      const y1 = centerY + Math.sin(angle) * startDist;
      const x2 = centerX + Math.cos(angle) * beamLength;
      const y2 = centerY + Math.sin(angle) * beamLength;
      
      const beamGradient = ctx.createLinearGradient(x1, y1, x2, y2);
      beamGradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
      beamGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      
      ctx.strokeStyle = beamGradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // PARTICLE EXPLOSION - lots more particles
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + progress * Math.PI * 3;
      // Use deterministic offset based on particle index
      const distOffset = Math.sin(i * 0.5) * 0.5 + 0.5; // 0 to 1
      const dist = portalRadius * 0.5 + distOffset * portalRadius * 0.5;
      const x = centerX + Math.cos(angle) * dist;
      const y = centerY + Math.sin(angle) * dist;
      const size = 3 + Math.sin(i * 0.7) * 2 + 1;
      const alpha = 0.6 + Math.sin(i * 0.3) * 0.2 + 0.2;
      
      // Mix of cyan and purple particles
      if (i % 3 === 0) {
        ctx.fillStyle = `rgba(138, 43, 226, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
      }
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
    
    // VERTICAL ENERGY COLUMN
    const columnWidth = 60;
    const columnHeight = 200;
    const columnGradient = ctx.createLinearGradient(
      centerX, centerY - columnHeight / 2,
      centerX, centerY + columnHeight / 2
    );
    columnGradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
    columnGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.4)');
    columnGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = columnGradient;
    ctx.fillRect(centerX - columnWidth / 2, centerY - columnHeight / 2, columnWidth, columnHeight);
    
    // ELECTRIC ARCS - deterministic based on progress to prevent flickering
    const arcCount = 8;
    for (let i = 0; i < arcCount; i++) {
      const angle1 = (i / arcCount) * Math.PI * 2 + progress * Math.PI * 0.5;
      const angle2 = angle1 + (Math.sin(i * 2.3) - 0.5) * Math.PI;
      const radius = portalRadius * 0.6;
      
      const x1 = centerX + Math.cos(angle1) * radius;
      const y1 = centerY + Math.sin(angle1) * radius;
      const x2 = centerX + Math.cos(angle2) * radius;
      const y2 = centerY + Math.sin(angle2) * radius;
      
      const alpha = 0.6 + Math.sin(progress * Math.PI * 2 + i) * 0.2 + 0.2;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  public reset(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.isMoving = false;
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.direction = 'right';
    this.movementSystem.reset();
    
    // Reset enhanced animation properties
    this.scaleX = 1;
    this.scaleY = 1;
    this.animationState = 'idle';
    this.stateTimer = 0;
    this.previousSpeed = 0;
    
    // Reset teleport state
    this.teleportCooldownTimer = 0;
    this.isTeleporting = false;
    this.teleportAnimationTimer = 0;
  }

  public resetMovementSystem() {
    // Completely reset movement system state with enhanced animations
    this.movementSystem.reset();
    this.isMoving = false;
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.animationState = 'idle';
    this.stateTimer = 0;
    this.previousSpeed = 0;
  }
  
  public unlockWeaponX(): void {
    if (!this.weaponXUnlocked) {
      this.weaponXUnlocked = true;
      this.weaponXMessageTimer = this.weaponXMessageDuration;
      logger.info('🔴 WEAPON X UNLOCKED! Press X to activate Bubble Shield!');
    }
  }
  
  public isWeaponXUnlocked(): boolean {
    return this.weaponXUnlocked;
  }
  
  public getBubbleShield(): BubbleShield {
    return this.bubbleShield;
  }
  
  private renderWeaponXMessage(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    const alpha = Math.max(0, Math.min(1, this.weaponXMessageTimer / this.weaponXMessageDuration));
    ctx.globalAlpha = alpha;
    
    const centerX = this.x + this.width / 2;
    const messageY = this.y - 40;
    
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText("You've found 'Weapon X'", centerX, messageY);
    ctx.strokeText("Press X to use", centerX, messageY + 20);
    
    ctx.fillStyle = '#00ff00';
    ctx.fillText("You've found 'Weapon X'", centerX, messageY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText("Press X to use", centerX, messageY + 20);
    
    ctx.restore();
  }
}
