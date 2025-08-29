/**
 * Movement System - Core Gameplay Mechanics
 * 
 * Learning Focus: How to implement game physics that feels good
 * This demonstrates the difference between realistic physics and game physics
 */

import { System } from './System';
import { Entity, EntityManager, PositionComponent, MovementComponent } from '../core/Entity';

export class MovementSystem extends System {
  readonly name = 'MovementSystem';
  readonly requiredComponents = ['position', 'movement'];
  
  // World constraints
  private worldBounds = {
    left: 20,
    right: 780,
    top: 20,
    bottom: 580
  };
  
  constructor() {
    super(10); // Run after input but before collision
  }
  
  /**
   * Process movement for all entities
   * Learning Focus: How game physics differs from real physics
   */
  protected process(entities: Entity[], entityManager: EntityManager, deltaTime: number): void {
    for (const entity of entities) {
      this.processEntityMovement(entity, entityManager, deltaTime);
    }
  }
  
  /**
   * Process movement for a single entity
   * This is where velocity becomes position changes
   */
  private processEntityMovement(entity: Entity, entityManager: EntityManager, deltaTime: number): void {
    const position = entityManager.getComponent<PositionComponent>(entity.id, 'position');
    const movement = entityManager.getComponent<MovementComponent>(entity.id, 'movement');
    
    if (!position || !movement) return;
    
    // Convert delta time from milliseconds to seconds for consistent physics
    const dt = deltaTime / 1000;
    
    // Update position based on velocity
    // This is the fundamental equation of motion: position += velocity * time
    position.x += movement.velocity.x * dt;
    position.y += movement.velocity.y * dt;
    
    // Apply world bounds - this is game physics, not real physics
    // In real physics, objects bounce or collide; in games, we often just clamp
    this.applyWorldBounds(position, movement, entity.id);
    
    // Apply velocity damping for entities without input
    // This makes movement feel more responsive and less "floaty"
    this.applyDamping(movement, dt, entity.id, entityManager);
    
    // Update rotation based on movement direction (optional visual enhancement)
    this.updateRotation(position, movement, dt);
  }
  
  /**
   * Keep entities within world boundaries
   * Learning Focus: Game constraints vs. realistic physics
   */
  private applyWorldBounds(position: PositionComponent, movement: MovementComponent, entityId: string): void {
    // Get entity size for proper boundary calculation
    // Note: In a real game, you'd get this from a collision or render component
    const entityRadius = 20; // Default radius
    
    const minX = this.worldBounds.left + entityRadius;
    const maxX = this.worldBounds.right - entityRadius;
    const minY = this.worldBounds.top + entityRadius;
    const maxY = this.worldBounds.bottom - entityRadius;
    
    // Clamp position to bounds
    const oldX = position.x;
    const oldY = position.y;
    
    position.x = Math.max(minX, Math.min(maxX, position.x));
    position.y = Math.max(minY, Math.min(maxY, position.y));
    
    // Stop velocity when hitting bounds (prevents "sliding" along walls)
    if (position.x !== oldX) {
      movement.velocity.x = 0;
    }
    if (position.y !== oldY) {
      movement.velocity.y = 0;
    }
  }
  
  /**
   * Apply velocity damping for natural-feeling movement
   * Learning Focus: How to make digital movement feel organic
   */
  private applyDamping(movement: MovementComponent, dt: number, entityId: string, entityManager: EntityManager): void {
    // Check if entity has input component and is currently receiving input
    const inputData = entityManager.getComponent(entityId, 'input');
    const hasActiveInput = inputData?.currentInput?.hasInput || false;
    
    // Only apply damping when there's no active input
    // This preserves responsive control while adding natural deceleration
    if (!hasActiveInput) {
      const dampingFactor = Math.pow(0.95, dt * 60); // 60fps normalized damping
      movement.velocity.x *= dampingFactor;
      movement.velocity.y *= dampingFactor;
      
      // Stop very small velocities to prevent infinite tiny movements
      if (Math.abs(movement.velocity.x) < 1) movement.velocity.x = 0;
      if (Math.abs(movement.velocity.y) < 1) movement.velocity.y = 0;
    }
  }
  
  /**
   * Update rotation based on movement direction
   * Learning Focus: Visual feedback enhances gameplay feel
   */
  private updateRotation(position: PositionComponent, movement: MovementComponent, dt: number): void {
    // Only update rotation if entity is moving significantly
    const speed = Math.sqrt(movement.velocity.x ** 2 + movement.velocity.y ** 2);
    
    if (speed > 10) { // Minimum speed threshold
      // Calculate target rotation based on movement direction
      const targetRotation = Math.atan2(movement.velocity.y, movement.velocity.x);
      
      // Smoothly interpolate to target rotation for natural feel
      const rotationSpeed = 8; // radians per second
      const rotationDiff = this.normalizeAngle(targetRotation - position.rotation);
      const rotationStep = rotationSpeed * dt;
      
      if (Math.abs(rotationDiff) > rotationStep) {
        position.rotation += Math.sign(rotationDiff) * rotationStep;
      } else {
        position.rotation = targetRotation;
      }
      
      // Keep rotation in [0, 2π] range
      position.rotation = this.normalizeAngle(position.rotation);
    }
  }
  
  /**
   * Normalize angle to [-π, π] range for smooth rotation
   */
  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }
  
  /**
   * Set world bounds (useful for different levels)
   */
  setWorldBounds(left: number, top: number, right: number, bottom: number): void {
    this.worldBounds = { left, top, right, bottom };
  }
  
  /**
   * Get world bounds for other systems
   */
  getWorldBounds(): typeof this.worldBounds {
    return { ...this.worldBounds };
  }
  
  /**
   * Apply external force to an entity (useful for knockback, wind, etc.)
   */
  applyForce(entityId: string, forceX: number, forceY: number, entityManager: EntityManager): void {
    const movement = entityManager.getComponent<MovementComponent>(entityId, 'movement');
    if (movement) {
      movement.velocity.x += forceX;
      movement.velocity.y += forceY;
    }
  }
  
  /**
   * Set entity velocity directly
   */
  setVelocity(entityId: string, velocityX: number, velocityY: number, entityManager: EntityManager): void {
    const movement = entityManager.getComponent<MovementComponent>(entityId, 'movement');
    if (movement) {
      movement.velocity.x = velocityX;
      movement.velocity.y = velocityY;
    }
  }
  
  /**
   * Get diagnostic information for debugging
   */
  getDiagnosticInfo(entityManager: EntityManager): any {
    const movingEntities = entityManager.getEntitiesWith(['position', 'movement']);
    const velocities = movingEntities.map(entity => {
      const movement = entityManager.getComponent<MovementComponent>(entity.id, 'movement');
      const speed = movement ? Math.sqrt(movement.velocity.x ** 2 + movement.velocity.y ** 2) : 0;
      return { entityId: entity.id, speed: speed.toFixed(1) };
    });
    
    const totalSpeed = velocities.reduce((sum, v) => sum + parseFloat(v.speed), 0);
    
    return {
      totalMovingEntities: movingEntities.length,
      averageSpeed: movingEntities.length > 0 ? (totalSpeed / movingEntities.length).toFixed(1) : 0,
      worldBounds: this.worldBounds,
      velocityDetails: velocities
    };
  }
}