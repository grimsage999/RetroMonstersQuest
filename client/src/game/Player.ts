import { InputManager } from './InputManager';

export class Player {
  private x: number;
  private y: number;
  private width: number = 16;
  private height: number = 16;
  private speed: number = 5;
  private isMoving: boolean = false;
  private direction: string = 'right';
  private animationFrame: number = 0;
  private animationTimer: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public update(inputManager: InputManager, deltaTime: number, canvasWidth: number, canvasHeight: number) {
    this.isMoving = false;
    
    // Handle movement input
    if (inputManager.isKeyPressed('ArrowUp')) {
      this.y -= this.speed;
      this.isMoving = true;
    }
    if (inputManager.isKeyPressed('ArrowDown')) {
      this.y += this.speed;
      this.isMoving = true;
    }
    if (inputManager.isKeyPressed('ArrowLeft')) {
      this.x -= this.speed;
      this.isMoving = true;
      this.direction = 'left';
    }
    if (inputManager.isKeyPressed('ArrowRight')) {
      this.x += this.speed;
      this.isMoving = true;
      this.direction = 'right';
    }
    
    // Keep player within bounds
    this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
    this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
    
    // Update animation
    if (this.isMoving) {
      this.animationTimer += deltaTime;
      if (this.animationTimer > 100) {
        this.animationFrame = (this.animationFrame + 1) % 4;
        this.animationTimer = 0;
      }
    } else {
      this.animationFrame = 0;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Draw Cosmo as a green alien UFO shape
    ctx.save();
    
    // UFO body (ellipse)
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/3, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // UFO dome
    ctx.fillStyle = '#00cc00';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width/2, this.y + this.height/3, this.width/3, this.height/4, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Alien inside (simple eyes)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x + 4, this.y + 4, 2, 2);
    ctx.fillRect(this.x + 10, this.y + 4, 2, 2);
    
    // Animation effect - glowing outline
    if (this.isMoving) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2 + 2, this.height/3 + 2, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    ctx.restore();
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
  }
}
