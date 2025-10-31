/**
 * SHARED COLLISION UTILITY
 * Centralized collision detection system to eliminate duplicate logic
 */

/**
 * Represents a rectangular bounding box for collision detection
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Utility class for all collision-related operations
 */
export class CollisionUtils {
  /**
   * Check collision between two rectangular bounding boxes
   * Uses the standard axis-aligned bounding box (AABB) collision detection algorithm
   * 
   * @param rect1 First rectangle to check
   * @param rect2 Second rectangle to check
   * @returns True if the rectangles are colliding, false otherwise
   */
  static checkCollision(rect1: BoundingBox, rect2: BoundingBox): boolean {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  /**
   * Check collision between a point and a rectangle
   * 
   * @param pointX X coordinate of the point
   * @param pointY Y coordinate of the point
   * @param rect Rectangle to check against
   * @returns True if the point is inside the rectangle, false otherwise
   */
  static checkPointRectCollision(pointX: number, pointY: number, rect: BoundingBox): boolean {
    return (
      pointX >= rect.x &&
      pointX <= rect.x + rect.width &&
      pointY >= rect.y &&
      pointY <= rect.y + rect.height
    );
  }

  /**
   * Check collision between two circles
   * 
   * @param circle1 First circle (x, y, radius)
   * @param circle2 Second circle (x, y, radius)
   * @returns True if the circles are colliding, false otherwise
   */
  static checkCircleCollision(
    circle1: { x: number; y: number; radius: number },
    circle2: { x: number; y: number; radius: number }
  ): boolean {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radiusSum = circle1.radius + circle2.radius;
    
    return distance <= radiusSum;
  }

  /**
   * Check collision between a circle and a rectangle
   * 
   * @param circle Circle to check (x, y, radius)
   * @param rect Rectangle to check
   * @returns True if the circle and rectangle are colliding, false otherwise
   */
  static checkCircleRectCollision(
    circle: { x: number; y: number; radius: number },
    rect: BoundingBox
  ): boolean {
    // Find the closest point on the rectangle to the circle
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    
    // Calculate distance between circle center and closest point
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    
    // If distance is less than radius, collision occurred
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    return distanceSquared < circle.radius * circle.radius;
  }

  /**
   * Get the overlap area between two rectangles
   * 
   * @param rect1 First rectangle
   * @param rect2 Second rectangle
   * @returns Overlap area as width * height, or 0 if no overlap
   */
  static getOverlapArea(rect1: BoundingBox, rect2: BoundingBox): number {
    const overlapX = Math.max(0, Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x));
    const overlapY = Math.max(0, Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y));
    
    return overlapX * overlapY;
  }

  /**
   * Get the overlap rectangle between two rectangles
   * 
   * @param rect1 First rectangle
   * @param rect2 Second rectangle
   * @returns Overlap rectangle or null if no overlap
   */
  static getOverlapRect(rect1: BoundingBox, rect2: BoundingBox): BoundingBox | null {
    const overlapX = Math.max(rect1.x, rect2.x);
    const overlapY = Math.max(rect1.y, rect2.y);
    const overlapWidth = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - overlapX;
    const overlapHeight = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - overlapY;
    
    if (overlapWidth > 0 && overlapHeight > 0) {
      return {
        x: overlapX,
        y: overlapY,
        width: overlapWidth,
        height: overlapHeight
      };
    }
    
    return null;
  }

  /**
   * Check if a rectangle is completely inside another rectangle
   * 
   * @param inner Inner rectangle
   * @param outer Outer rectangle
   * @returns True if inner is completely inside outer
   */
  static isRectInsideRect(inner: BoundingBox, outer: BoundingBox): boolean {
    return (
      inner.x >= outer.x &&
      inner.y >= outer.y &&
      inner.x + inner.width <= outer.x + outer.width &&
      inner.y + inner.height <= outer.y + outer.height
    );
  }

  /**
   * Check collision with a tolerance (buffer zone)
   * 
   * @param rect1 First rectangle
   * @param rect2 Second rectangle
   * @param tolerance Additional buffer zone around rectangles
   * @returns True if rectangles collide within tolerance
   */
  static checkCollisionWithTolerance(rect1: BoundingBox, rect2: BoundingBox, tolerance: number = 0): boolean {
    const expandedRect1 = {
      x: rect1.x - tolerance,
      y: rect1.y - tolerance,
      width: rect1.width + 2 * tolerance,
      height: rect1.height + 2 * tolerance
    };
    
    return this.checkCollision(expandedRect1, rect2);
  }
}

/**
 * Collision system that uses spatial partitioning to optimize collision detection
 * when dealing with many objects
 */
export class OptimizedCollisionSystem {
  private spatialGrid: SpatialGrid;
  private gameWidth: number;
  private gameHeight: number;
  
  constructor(width: number, height: number, cellSize: number = FIXED_GAME_CONSTANTS.SPATIAL_GRID_CELL_SIZE) {
    this.gameWidth = width;
    this.gameHeight = height;
    this.spatialGrid = new SpatialGrid(width, height, cellSize);
  }
  
  /**
   * Clear all entities from the collision system
   */
  clear(): void {
    this.spatialGrid.clear();
  }
  
  /**
   * Add an entity to the collision system
   */
  addEntity(entity: any, x: number, y: number, width: number, height: number): void {
    this.spatialGrid.insert(entity, x, y, width, height);
  }
  
  /**
   * Remove an entity from the collision system
   */
  removeEntity(entity: any, x: number, y: number, width: number, height: number): void {
    this.spatialGrid.remove(entity, x, y, width, height);
  }
  
  /**
   * Update an entity's position in the collision system
   */
  updateEntity(entity: any, oldX: number, oldY: number, oldWidth: number, oldHeight: number, 
               newX: number, newY: number, newWidth: number, newHeight: number): void {
    this.spatialGrid.remove(entity, oldX, oldY, oldWidth, oldHeight);
    this.spatialGrid.insert(entity, newX, newY, newWidth, newHeight);
  }
  
  /**
   * Get potential collision candidates for a given bounds
   */
  getPotentialCollisions(x: number, y: number, width: number, height: number): any[] {
    return this.spatialGrid.getPotentialCollisions(x, y, width, height);
  }
  
  /**
   * Check collision for a specific entity and get actual collisions
   */
  getActualCollisions(x: number, y: number, width: number, height: number): any[] {
    const potentialCollisions = this.getPotentialCollisions(x, y, width, height);
    const actualCollisions: any[] = [];
    
    for (const entity of potentialCollisions) {
      // Here we would need to get the actual bounds of the entity
      // For now, we'll assume an interface that provides bounds
      if ('getBounds' in entity && typeof entity.getBounds === 'function') {
        const entityBounds = entity.getBounds();
        if (CollisionUtils.checkCollision({x, y, width, height}, entityBounds)) {
          actualCollisions.push(entity);
        }
      }
    }
    
    return actualCollisions;
  }
}

// Import required dependencies for the collision system
// (In a real implementation, SpatialGrid and FIXED_GAME_CONSTANTS would be properly imported)