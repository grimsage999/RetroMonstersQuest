
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
  private animationState: 'idle' | 'walking' | 'dashing' | 'starting' | 'stopping' = 'idle';
  private stateTimer: number = 0;
  private previousSpeed: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.movementSystem = new MovementSystem();
    // Configure for faster, more responsive gameplay
    this.movementSystem.configure({
      baseSpeed: 6,
      maxSpeed: 8,
      acceleration: 0.35,
      deceleration: 0.2,
      dashSpeed: 10, // Fast burst! 10 px/frame * 6 frames = ~60px total
      dashDuration: 100, // 0.1s duration for quick, responsive dash
      dashCooldown: 800 // 0.8 seconds to prevent spam
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
    
    // Check for dash input (Shift key)
    const isDashPressed = inputManager.isKeyPressed('Shift');
    
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

  public render(ctx: CanvasRenderingContext2D) {
    const state = this.movementSystem.getState();
    
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

  public isDashing(): boolean {
    return this.movementSystem.getState().isDashing;
  }

  public canDash(): boolean {
    return this.movementSystem.getState().canDash;
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
}
