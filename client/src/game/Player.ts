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

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
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
    
    // Update movement state for animation
    const state = this.movementSystem.getState();
    this.isMoving = state.speed > 0.5;
    
    // Update animation - smoother timing
    if (this.isMoving) {
      // Speed up animation when dashing
      const animSpeed = state.isDashing ? 150 : 300;
      this.animationTimer += deltaTime;
      if (this.animationTimer > animSpeed) {
        this.animationFrame = (this.animationFrame + 1) % 2; // Simple 2-frame walk cycle
        this.animationTimer = 0;
      }
    } else {
      this.animationFrame = 0;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Draw Cosmo as "little green man" with walk cycle animation
    ctx.save();
    
    // Disable image smoothing for pixelated effect
    ctx.imageSmoothingEnabled = false;
    
    // Choose sprite based on movement and animation frame
    let spritePixels;
    if (this.isMoving) {
      // Walk cycle animation (2 frames)
      spritePixels = this.animationFrame === 0 ? this.getWalkFrame1() : this.getWalkFrame2();
    } else {
      // Idle animation
      spritePixels = this.getIdleFrame();
    }
    
    // Classic "little green man" color palette
    const colors = [
      'transparent',  // 0 - transparent
      '#2D5016',      // 1 - dark green outline
      '#39FF14',      // 2 - bright alien green
      '#000000',      // 3 - black eyes
      '#FFFFFF',      // 4 - white eye highlights
      '#228B22',      // 5 - medium green
      '#32CD32',      // 6 - lime green details
      '#FFD700',      // 7 - golden details
    ];
    
    const scale = 3; // Much larger scale for better visibility
    for (let row = 0; row < spritePixels.length; row++) {
      for (let col = 0; col < spritePixels[row].length; col++) {
        const colorIndex = spritePixels[row][col];
        if (colorIndex > 0) {
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(
            this.x + col * scale, 
            this.y + row * scale, 
            scale, 
            scale
          );
        }
      }
    }
    
    // No visual effects when moving - clean pixel art look
    
    ctx.restore();
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
  }

  public resetMovementSystem() {
    // Completely reset movement system state
    this.movementSystem.reset();
    this.isMoving = false;
    this.animationFrame = 0;
    this.animationTimer = 0;
  }
}
