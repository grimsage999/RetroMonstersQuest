// Simple confetti effect for victory screen
export class Confetti {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    rotationSpeed: number;
  }> = [];
  private animationId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.createParticles();
  }

  private createParticles() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    
    for (let i = 0; i < 10; i++) { // Reduced from 50 to 10 for performance
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5
      });
    }
  }

  public start() {
    this.animate();
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0; // Reset animation ID to prevent memory leaks
    }
  }

  private animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.rotationSpeed;
      
      // Apply gravity
      particle.vy += 0.1;
      
      // Remove particles that are off screen
      if (particle.y > this.canvas.height + 10) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // Draw particle
      this.ctx.save();
      this.ctx.translate(particle.x, particle.y);
      this.ctx.rotate(particle.rotation * Math.PI / 180);
      this.ctx.fillStyle = particle.color;
      this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      this.ctx.restore();
    }
    
    // Continue animation if particles exist
    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }
}