/**
 * PRE-COMPUTATION SYSTEM
 * Pre-computes expensive calculations during loading to improve gameplay performance
 */

import { EnemyType } from './Enemy';

// Pre-computed pathfinding, animation frames, and visual effects
export class PrecomputedCalculations {
  private pathfindingCache: Map<string, { x: number; y: number }[]> = new Map();
  private spriteCache: Map<string, HTMLCanvasElement> = new Map();
  private animationCache: Map<string, HTMLCanvasElement[]> = new Map();
  private collisionShapes: Map<string, number[][]> = new Map();
  
  /**
   * Pre-compute enemy movement patterns during level loading
   */
  public precomputeEnemyPaths(levelWidth: number, levelHeight: number, enemies: Array<{ type: EnemyType, startX: number, startY: number }>): void {
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const pathKey = `path_${enemy.type}_${enemy.startX}_${enemy.startY}`;
      
      // Compute path based on enemy type
      let path: { x: number; y: number }[] = [];
      
      switch (enemy.type) {
        case 'cia':
          path = this.computePatrolPath(enemy.startX, enemy.startY, levelWidth, levelHeight, 200);
          break;
        case 'army':
          path = this.computePatrolPath(enemy.startX, enemy.startY, levelWidth, levelHeight, 150);
          break;
        case 'rat':
          path = this.computeRandomWalkPath(enemy.startX, enemy.startY, levelWidth, levelHeight, 50);
          break;
        case 'zombie':
          path = this.computeSlowPatrolPath(enemy.startX, enemy.startY, levelWidth, levelHeight, 300);
          break;
        default:
          path = this.computeDefaultPath(enemy.startX, enemy.startY, levelWidth, levelHeight);
      }
      
      this.pathfindingCache.set(pathKey, path);
    }
  }
  
  private computePatrolPath(startX: number, startY: number, width: number, height: number, distance: number): { x: number; y: number }[] {
    // Pre-compute a patrol path for this enemy
    const path: { x: number; y: number }[] = [];
    const segments = 8;
    const segmentDistance = distance / segments;
    
    let currentX = startX;
    let currentY = startY;
    
    for (let i = 0; i < segments; i++) {
      // Move in a pattern (e.g., rectangle)
      switch (i % 4) {
        case 0: // Move right
          currentX = Math.min(width - 25, currentX + segmentDistance);
          break;
        case 1: // Move down
          currentY = Math.min(height - 25, currentY + segmentDistance);
          break;
        case 2: // Move left
          currentX = Math.max(0, currentX - segmentDistance);
          break;
        case 3: // Move up
          currentY = Math.max(0, currentY - segmentDistance);
          break;
      }
      path.push({ x: currentX, y: currentY });
    }
    
    return path;
  }
  
  private computeRandomWalkPath(startX: number, startY: number, width: number, height: number, distance: number): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    const segments = 12;
    
    let currentX = startX;
    let currentY = startY;
    
    for (let i = 0; i < segments; i++) {
      // Random direction displacement
      const angle = Math.random() * Math.PI * 2;
      const step = distance / segments;
      currentX = Math.max(10, Math.min(width - 20, currentX + Math.cos(angle) * step));
      currentY = Math.max(10, Math.min(height - 20, currentY + Math.sin(angle) * step));
      path.push({ x: currentX, y: currentY });
    }
    
    return path;
  }
  
  private computeSlowPatrolPath(startX: number, startY: number, width: number, height: number, distance: number): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    const segments = 6;
    
    let currentX = startX;
    let currentY = startY;
    
    for (let i = 0; i < segments; i++) {
      // Sinusoidal pattern for zombie movement
      currentX = Math.max(10, Math.min(width - 25, currentX + (Math.random() - 0.5) * 50));
      currentY = Math.max(10, Math.min(height - 25, currentY + (Math.random() - 0.5) * 30));
      path.push({ x: currentX, y: currentY });
    }
    
    return path;
  }
  
  private computeDefaultPath(startX: number, startY: number, width: number, height: number): { x: number; y: number }[] {
    return [{ x: startX, y: startY }];
  }
  
  /**
   * Pre-render sprite frames during loading
   */
  public precomputeSprites(): void {
    this.precomputePlayerSprites();
    this.precomputeEnemySprites();
    this.precomputeHazardSprites();
  }
  
  private precomputePlayerSprites(): void {
    // Pre-render all player animation frames
    const frameNames = ['idle', 'walk1', 'walk2', 'walk3', 'starting'];
    
    for (const frameName of frameNames) {
      const spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = 48; // 16px * 3 scale
      spriteCanvas.height = 48;
      const ctx = spriteCanvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      
      // Render the specific player frame to the canvas
      this.renderPlayerFrame(ctx, frameName);
      
      this.spriteCache.set(`player_${frameName}`, spriteCanvas);
    }
  }
  
  private precomputeEnemySprites(): void {
    const enemyTypes: EnemyType[] = ['cia', 'army', 'rat', 'zombie'];
    const frameTypes = ['frame1', 'frame2'];
    
    for (const enemyType of enemyTypes) {
      for (const frameType of frameTypes) {
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = 48;
        spriteCanvas.height = 48;
        const ctx = spriteCanvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        
        // Render the specific enemy frame to the canvas
        this.renderEnemyFrame(ctx, enemyType, frameType);
        
        this.spriteCache.set(`enemy_${enemyType}_${frameType}`, spriteCanvas);
      }
    }
  }
  
  private precomputeHazardSprites(): void {
    // Pre-render hazard sprites
    const hazardTypes = ['dancing_cactus', 'spinning_cactus', 'manhole'];
    
    for (const hazardType of hazardTypes) {
      const spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = 48;
      spriteCanvas.height = 48;
      const ctx = spriteCanvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      
      // Render the specific hazard to the canvas
      this.renderHazardFrame(ctx, hazardType);
      
      this.spriteCache.set(`hazard_${hazardType}`, spriteCanvas);
    }
  }
  
  // Dummy rendering functions - these would use the same logic as the current render methods
  private renderPlayerFrame(ctx: CanvasRenderingContext2D, frameName: string): void {
    // This would use the same logic as Player.render() method for specific frames
    // For this example, we'll just draw a placeholder
    ctx.fillStyle = '#39FF14'; // Bright green
    ctx.fillRect(0, 0, 48, 48);
    ctx.fillStyle = '#000000';
    ctx.fillRect(10, 10, 8, 8);
    ctx.fillRect(30, 10, 8, 8);
  }
  
  private renderEnemyFrame(ctx: CanvasRenderingContext2D, enemyType: EnemyType, frameType: string): void {
    // This would use the same logic as Enemy.render() method for specific frames
    // For this example, we'll just draw a placeholder
    const colors: Record<EnemyType, string> = {
      cia: '#000000',
      army: '#228b22',
      rat: '#39ff14',
      zombie: '#2F4F2F'
    };
    
    ctx.fillStyle = colors[enemyType];
    ctx.fillRect(0, 0, 48, 48);
  }
  
  private renderHazardFrame(ctx: CanvasRenderingContext2D, hazardType: string): void {
    // This would use the same logic as hazard render methods
    // For this example, we'll just draw a placeholder
    ctx.fillStyle = '#8B4513'; // Brown for cactus
    ctx.fillRect(0, 0, 48, 48);
  }
  
  /**
   * Get precomputed path for an enemy
   */
  public getEnemyPath(enemyType: EnemyType, startX: number, startY: number): { x: number; y: number }[] | null {
    const pathKey = `path_${enemyType}_${startX}_${startY}`;
    return this.pathfindingCache.get(pathKey) || null;
  }
  
  /**
   * Get precomputed sprite for rendering
   */
  public getSprite(key: string): HTMLCanvasElement | null {
    return this.spriteCache.get(key) || null;
  }
  
  /**
   * Pre-compute collision shapes during loading
   */
  public precomputeCollisionShapes(): void {
    // Define collision masks for complex sprites
    this.collisionShapes.set('player', this.createCircularCollisionMask(24, 24, 20));
    this.collisionShapes.set('enemy_cia', this.createRectangularCollisionMask(24, 24));
    this.collisionShapes.set('enemy_rat', this.createCircularCollisionMask(18, 18, 16));
    this.collisionShapes.set('cookie', this.createCircularCollisionMask(8, 8, 6));
  }
  
  private createCircularCollisionMask(centerX: number, centerY: number, radius: number): number[][] {
    const size = Math.ceil(radius * 2);
    const mask: number[][] = [];
    
    for (let y = 0; y < size; y++) {
      mask[y] = [];
      for (let x = 0; x < size; x++) {
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        mask[y][x] = distance <= radius ? 1 : 0;
      }
    }
    
    return mask;
  }
  
  private createRectangularCollisionMask(width: number, height: number): number[][] {
    const mask: number[][] = [];
    for (let y = 0; y < height; y++) {
      mask[y] = Array(width).fill(1);
    }
    return mask;
  }
  
  /**
   * Get precomputed collision shape
   */
  public getCollisionShape(key: string): number[][] | null {
    return this.collisionShapes.get(key) || null;
  }
  
  /**
   * Clear cached computations
   */
  public clearCache(): void {
    this.pathfindingCache.clear();
    this.spriteCache.clear();
    this.animationCache.clear();
    this.collisionShapes.clear();
  }
}

// Integration with level loading
export class LevelLoader {
  private precomputedCalculations: PrecomputedCalculations = new PrecomputedCalculations();
  
  public async loadLevel(levelNumber: number, canvasWidth: number, canvasHeight: number, enemies: Array<{ type: EnemyType, x: number, y: number }>): Promise<void> {
    console.log(`Precomputing calculations for level ${levelNumber}...`);
    
    // Pre-compute all expensive calculations
    this.precomputedCalculations.precomputeEnemyPaths(canvasWidth, canvasHeight, enemies);
    this.precomputedCalculations.precomputeSprites();
    this.precomputedCalculations.precomputeCollisionShapes();
    
    console.log(`Level ${levelNumber} precomputations complete.`);
  }
  
  public getPrecomputedCalculations(): PrecomputedCalculations {
    return this.precomputedCalculations;
  }
}