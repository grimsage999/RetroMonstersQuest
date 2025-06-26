export type EnemyType = 'cia' | 'army' | 'rat';

export class Enemy {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private speedX: number;
  private speedY: number;
  private type: EnemyType;
  private animationFrame: number = 0;
  private animationTimer: number = 0;
  private active: boolean = true;

  constructor(x: number, y: number, type: EnemyType) {
    this.x = x;
    this.y = y;
    this.type = type;
    
    switch (type) {
      case 'cia':
        this.width = 25;
        this.height = 25;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        break;
      case 'army':
        this.width = 25;
        this.height = 25;
        this.speedX = (Math.random() - 0.5) * 1.5;
        this.speedY = (Math.random() - 0.5) * 1.5;
        break;
      case 'rat':
        this.width = 20;
        this.height = 20;
        this.speedX = (Math.random() - 0.5) * 3;
        this.speedY = (Math.random() - 0.5) * 3;
        break;
    }
  }

  public update(deltaTime: number, canvasWidth: number, canvasHeight: number) {
    if (!this.active) return;
    
    // Move enemy
    this.x += this.speedX;
    this.y += this.speedY;
    
    // Bounce off walls
    if (this.x <= 0 || this.x + this.width >= canvasWidth) {
      this.speedX = -this.speedX;
    }
    if (this.y <= 0 || this.y + this.height >= canvasHeight) {
      this.speedY = -this.speedY;
    }
    
    // Keep within bounds
    this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
    this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
    
    // Update animation
    this.animationTimer += deltaTime;
    if (this.animationTimer > 200) {
      this.animationFrame = (this.animationFrame + 1) % 4;
      this.animationTimer = 0;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;
    
    ctx.save();
    
    switch (this.type) {
      case 'cia':
        // CIA Agent - black suit with sunglasses
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Sunglasses
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x + 3, this.y + 3, 8, 3);
        ctx.fillRect(this.x + 14, this.y + 3, 8, 3);
        
        // White shirt
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 8, this.y + 8, 9, 12);
        
        // Tie
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 11, this.y + 8, 3, 8);
        break;
        
      case 'army':
        // Army Man - green camouflage
        ctx.fillStyle = '#228b22';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Helmet
        ctx.fillStyle = '#1f5f1f';
        ctx.fillRect(this.x + 3, this.y, this.width - 6, 8);
        
        // Camo pattern
        ctx.fillStyle = '#1f5f1f';
        ctx.fillRect(this.x + 2, this.y + 10, 4, 4);
        ctx.fillRect(this.x + 19, this.y + 15, 4, 4);
        break;
        
      case 'rat':
        // Radioactive Rat - glowing green
        ctx.fillStyle = '#39ff14';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Glowing effect
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#32cd32';
        ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
        
        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 3, this.y + 3, 2, 2);
        ctx.fillRect(this.x + this.width - 5, this.y + 3, 2, 2);
        
        // Tail
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y + this.height/2);
        ctx.lineTo(this.x + this.width + 8, this.y + this.height/2 - 4);
        ctx.stroke();
        break;
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

  public isActive(): boolean {
    return this.active;
  }

  public destroy() {
    this.active = false;
  }
}
