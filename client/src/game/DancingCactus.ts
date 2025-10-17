/**
 * Dancing Cactus Hazard
 * Rhythmically swaying environmental obstacle for Level 1-2
 */

export interface HazardConfig {
  type: 'dancing_cactus' | 'spinning_cactus';
  position: { x: number; y: number };
  amplitude?: number;
  speed?: number;
  spin_speed?: number;
  fireball?: {
    interval: number;
    speed: number;
    homing: boolean;
    damage: number;
  };
}

export class DancingCactus {
  private baseX: number;
  private baseY: number;
  private currentX: number;
  private amplitude: number;
  private speed: number;
  private time: number = 0;
  private width: number = 32;
  private height: number = 64;

  constructor(x: number, y: number, amplitude: number, speed: number) {
    this.baseX = x;
    this.baseY = y;
    this.currentX = x;
    this.amplitude = amplitude;
    this.speed = speed;
  }

  public update(deltaTime: number): void {
    // Update animation time
    this.time += deltaTime * 0.001 * this.speed;
    
    // Calculate swaying motion using sine wave
    this.currentX = this.baseX + Math.sin(this.time) * this.amplitude;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    // Calculate sway angle for tilting effect
    const swayAngle = Math.sin(this.time) * 0.15; // Tilt up to ~8.5 degrees
    
    // Move to cactus position
    ctx.translate(this.currentX + this.width / 2, this.baseY + this.height);
    ctx.rotate(swayAngle);
    
    // Draw dancing cactus body (vibrant green)
    ctx.fillStyle = '#2ECC71'; // Bright emerald green
    ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
    
    // Draw cactus segments for texture
    ctx.fillStyle = '#27AE60'; // Darker green for depth
    for (let i = 0; i < 4; i++) {
      const segmentY = -this.height + (i * 16);
      ctx.fillRect(-this.width / 2 + 2, segmentY, this.width - 4, 2);
    }
    
    // Draw swaying arms (animated)
    const armOffset = Math.sin(this.time * 2) * 4;
    
    // Left arm
    ctx.fillStyle = '#2ECC71';
    ctx.fillRect(-this.width / 2 - 12, -this.height + 20 + armOffset, 12, 8);
    ctx.fillRect(-this.width / 2 - 20, -this.height + 24 + armOffset, 8, 12);
    
    // Right arm  
    ctx.fillRect(this.width / 2, -this.height + 16 - armOffset, 12, 8);
    ctx.fillRect(this.width / 2 + 8, -this.height + 20 - armOffset, 8, 12);
    
    // Draw spikes (bright accent)
    ctx.fillStyle = '#F39C12'; // Orange/yellow spikes
    const spikePositions = [
      { x: -10, y: -50 }, { x: 0, y: -55 }, { x: 10, y: -48 },
      { x: -8, y: -30 }, { x: 8, y: -32 },
      { x: -6, y: -10 }, { x: 6, y: -12 }
    ];
    
    spikePositions.forEach(spike => {
      ctx.beginPath();
      ctx.moveTo(spike.x, spike.y);
      ctx.lineTo(spike.x - 3, spike.y - 6);
      ctx.lineTo(spike.x + 3, spike.y - 6);
      ctx.closePath();
      ctx.fill();
    });
    
    // Draw dancing face (cute expression)
    ctx.fillStyle = '#000000';
    // Eyes
    ctx.fillRect(-8, -this.height + 14, 4, 4);
    ctx.fillRect(4, -this.height + 14, 4, 4);
    
    // Smiling mouth
    ctx.beginPath();
    ctx.arc(0, -this.height + 26, 6, 0, Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    
    // Add glow effect for "dancing" feel
    ctx.shadowColor = '#2ECC71';
    ctx.shadowBlur = 10 + Math.sin(this.time * 3) * 5;
    
    ctx.restore();
  }

  public getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.currentX,
      y: this.baseY,
      width: this.width,
      height: this.height
    };
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.currentX, y: this.baseY };
  }
}
