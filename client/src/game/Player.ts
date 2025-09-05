
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
import { OptimizedSpriteRenderer } from './OptimizedSpriteRenderer';

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
  
  // CRITICAL: Jump/Dodge mechanics as requested
  private jumpVelocity: number = 0;
  private isJumping: boolean = false;
  private groundY: number = 0;
  private canDodge: boolean = true;
  private dodgeTimer: number = 0;
  private isInvincible: boolean = false;
  private invincibilityTimer: number = 0;
  private movementSystem: MovementSystem;
  private screenShakeX: number = 0;
  private screenShakeY: number = 0;
  
  // Simplified animation properties
  private simpleWalkCycle: boolean = false;
  
  // CRITICAL: Optimized sprite renderer for performance
  private static spriteRenderer: OptimizedSpriteRenderer = new OptimizedSpriteRenderer();
  private cachedSprites: { [key: string]: ImageData } = {};

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.groundY = y; // Store ground position for jumping
    this.movementSystem = new MovementSystem();
    // Configure for smoother gameplay
    this.movementSystem.configure({
      baseSpeed: 4,
      maxSpeed: 6,
      acceleration: 0.25,
      deceleration: 0.15,
      dashSpeed: 10,
      dashDuration: 200,
      dashCooldown: 800
    });
  }

  public update(inputManager: InputManager, deltaTime: number, canvasWidth: number, canvasHeight: number) {
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
    
    // CRITICAL: Jump mechanics (Spacebar)
    if (inputManager.isKeyPressed(' ') && !this.isJumping) {
      this.jump();
    }
    
    // CRITICAL: Dodge mechanics (Shift key) 
    if (inputManager.isKeyPressed('Shift') && this.canDodge) {
      this.dodge();
    }
    
    const isDashPressed = false; // Removed weapon system, dodge separate from dash
    
    // Get movement from movement system
    const movement = this.movementSystem.update(inputX, inputY, isDashPressed, deltaTime);
    
    // Apply movement
    // Sanitize movement to prevent NaN/Infinity crashes
    const safeDx = Number.isFinite(movement.dx) ? movement.dx : 0;
    const safeDy = Number.isFinite(movement.dy) ? movement.dy : 0;
    
    this.x += safeDx;
    this.y += safeDy;
    
    // CRITICAL: Update jump physics
    this.updateJumpPhysics(deltaTime);
    
    // Update dodge timer
    this.updateDodgeTimer(deltaTime);
    
    // Update invincibility timer
    this.updateInvincibilityTimer(deltaTime);
    
    // Keep player within bounds
    this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
    // For Y, respect ground level when not jumping
    if (!this.isJumping) {
      this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
    }
    
    // Simple animation system
    const state = this.movementSystem.getState();
    this.isMoving = state.speed > 0.5;
    
    // Simple 2-frame walk cycle
    if (this.isMoving) {
      this.animationTimer += deltaTime;
      if (this.animationTimer > 300) {
        this.simpleWalkCycle = !this.simpleWalkCycle;
        this.animationTimer = 0;
      }
    } else {
      this.simpleWalkCycle = false;
      this.animationTimer = 0;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.imageSmoothingEnabled = false; // Critical for pixel art
    
    const spritePixels = this.getCurrentSpriteFrame();
    
    // CRITICAL PERFORMANCE FIX: Use optimized sprite rendering
    this.renderSpriteOptimized(ctx, spritePixels);
    
    ctx.restore();
  }

  private getCurrentSpriteFrame(): number[][] {
    if (this.isMoving) {
      return this.simpleWalkCycle ? this.getWalkFrame1() : this.getWalkFrame2();
    }
    return this.getIdleFrame();
  }

  /**
   * CRITICAL PERFORMANCE FIX: Optimized sprite rendering
   * Replaces 256+ individual fillRect calls with cached ImageData rendering
   */
  private renderSpriteOptimized(ctx: CanvasRenderingContext2D, spritePixels: number[][]) {
    const colors = PlayerSpriteColors.COSMO_PALETTE;
    const scale = PlayerSpriteColors.SPRITE_SCALE;
    
    // Create sprite ID for caching
    const spriteId = this.getSpriteId(spritePixels);
    
    // Get or create cached sprite
    if (!this.cachedSprites[spriteId]) {
      this.cachedSprites[spriteId] = Player.spriteRenderer.preRenderSprite(
        spritePixels, 
        colors, 
        scale, 
        spriteId
      );
    }
    
    // Render with single optimized call (replaces 256+ fillRect calls)
    Player.spriteRenderer.renderSprite(ctx, this.cachedSprites[spriteId], this.x, this.y);
  }
  
  /**
   * Generate unique ID for sprite caching
   */
  private getSpriteId(spritePixels: number[][]): string {
    // Simple hash based on sprite content for caching
    let hash = '';
    for (let row = 0; row < Math.min(spritePixels.length, 4); row++) {
      for (let col = 0; col < Math.min(spritePixels[row].length, 4); col++) {
        hash += spritePixels[row][col].toString();
      }
    }
    return `player_${hash}_${this.direction}_${this.simpleWalkCycle}`;
  }

  /**
   * CRITICAL: Jump mechanics implementation
   */
  private jump() {
    this.jumpVelocity = -300; // Pixels per second upward
    this.isJumping = true;
  }

  /**
   * CRITICAL: Dodge mechanics implementation
   */
  private dodge() {
    this.canDodge = false;
    this.dodgeTimer = 500; // 500ms cooldown
    this.isInvincible = true;
    this.invincibilityTimer = 300; // 300ms invincibility
  }

  /**
   * CRITICAL: Jump physics update
   */
  private updateJumpPhysics(deltaTime: number) {
    if (this.isJumping) {
      this.y += this.jumpVelocity * (deltaTime / 1000);
      this.jumpVelocity += 800 * (deltaTime / 1000); // Gravity

      // Land when reaching ground
      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.isJumping = false;
        this.jumpVelocity = 0;
      }
    }
  }

  /**
   * Update dodge cooldown timer
   */
  private updateDodgeTimer(deltaTime: number) {
    if (!this.canDodge) {
      this.dodgeTimer -= deltaTime;
      if (this.dodgeTimer <= 0) {
        this.canDodge = true;
      }
    }
  }

  /**
   * Update invincibility timer
   */
  private updateInvincibilityTimer(deltaTime: number) {
    if (this.isInvincible) {
      this.invincibilityTimer -= deltaTime;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
      }
    }
  }

  /**
   * Check if player is currently invincible
   */
  public isPlayerInvincible(): boolean {
    return this.isInvincible;
  }

  /**
   * Get jump state for external systems
   */
  public getJumpState() {
    return {
      isJumping: this.isJumping,
      canDodge: this.canDodge,
      isInvincible: this.isInvincible
    };
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
  

  public getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  public reset(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.isMoving = false;
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.direction = 'right';
    this.movementSystem.reset();
    
    // Reset simple animation properties
    this.simpleWalkCycle = false;
  }

  public resetMovementSystem() {
    // Completely reset movement system state
    this.movementSystem.reset();
    this.isMoving = false;
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.simpleWalkCycle = false;
  }
}
