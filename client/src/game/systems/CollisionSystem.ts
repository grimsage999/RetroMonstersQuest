/**
 * Collision System - Game Interaction Mechanics
 * 
 * Learning Focus: How collision detection enables gameplay interactions
 * This demonstrates spatial optimization and game rule implementation
 */

import { System } from './System';
import { Entity, EntityManager, PositionComponent, CollisionComponent } from '../core/Entity';

export interface CollisionEvent {
  entityA: string;
  entityB: string;
  type: string;
  data: any;
}

export class CollisionSystem extends System {
  readonly name = 'CollisionSystem';
  readonly requiredComponents = ['position', 'collision'];
  
  // Event listeners for different collision types
  private collisionHandlers: Map<string, (event: CollisionEvent) => void> = new Map();
  
  // Performance optimization - spatial grid for broad phase collision detection
  private spatialGrid: Map<string, string[]> = new Map();
  private gridSize = 64; // Size of each grid cell
  
  constructor() {
    super(20); // Run after movement but before rendering
  }
  
  /**
   * Process all collisions
   * Learning Focus: Two-phase collision detection (broad + narrow)
   */
  protected process(entities: Entity[], entityManager: EntityManager, deltaTime: number): void {
    // Phase 1: Broad phase - use spatial grid to find potential collisions
    this.updateSpatialGrid(entities, entityManager);
    const potentialCollisions = this.findPotentialCollisions(entities, entityManager);
    
    // Phase 2: Narrow phase - precise collision detection
    for (const pairKey of Array.from(potentialCollisions)) {
      this.checkCollision(pairKey, '', entityManager);
    }
  }
  
  /**
   * Update spatial grid for efficient collision detection
   * Learning Focus: How to optimize N² collision checking
   */
  private updateSpatialGrid(entities: Entity[], entityManager: EntityManager): void {
    this.spatialGrid.clear();
    
    for (const entity of entities) {
      const position = entityManager.getComponent<PositionComponent>(entity.id, 'position');
      const collision = entityManager.getComponent<CollisionComponent>(entity.id, 'collision');
      
      if (!position || !collision) continue;
      
      // Calculate which grid cells this entity occupies
      const radius = collision.radius;
      const leftCell = Math.floor((position.x - radius) / this.gridSize);
      const rightCell = Math.floor((position.x + radius) / this.gridSize);
      const topCell = Math.floor((position.y - radius) / this.gridSize);
      const bottomCell = Math.floor((position.y + radius) / this.gridSize);
      
      // Add entity to all cells it occupies
      for (let x = leftCell; x <= rightCell; x++) {
        for (let y = topCell; y <= bottomCell; y++) {
          const cellKey = `${x},${y}`;
          if (!this.spatialGrid.has(cellKey)) {
            this.spatialGrid.set(cellKey, []);
          }
          this.spatialGrid.get(cellKey)!.push(entity.id);
        }
      }
    }
  }
  
  /**
   * Find potential collision pairs using spatial grid
   * This reduces collision checks from O(n²) to roughly O(n)
   */
  private findPotentialCollisions(entities: Entity[], entityManager: EntityManager): Set<string> {
    const pairs = new Set<string>();
    
    // For each grid cell, check collisions between entities in that cell
    for (const entityIds of Array.from(this.spatialGrid.values())) {
      for (let i = 0; i < entityIds.length; i++) {
        for (let j = i + 1; j < entityIds.length; j++) {
          const entityA = entityIds[i];
          const entityB = entityIds[j];
          
          // Create a consistent pair key (alphabetical order)
          const pairKey = entityA < entityB ? `${entityA}:${entityB}` : `${entityB}:${entityA}`;
          pairs.add(pairKey);
        }
      }
    }
    
    return pairs;
  }
  
  /**
   * Check if two entities are actually colliding
   * Learning Focus: Circle-circle collision detection
   */
  private checkCollision(pairKey: string, _: string, entityManager: EntityManager): void {
    const [entityIdA, entityIdB] = pairKey.split(':');
    
    const posA = entityManager.getComponent<PositionComponent>(entityIdA, 'position');
    const posB = entityManager.getComponent<PositionComponent>(entityIdB, 'position');
    const colA = entityManager.getComponent<CollisionComponent>(entityIdA, 'collision');
    const colB = entityManager.getComponent<CollisionComponent>(entityIdB, 'collision');
    
    if (!posA || !posB || !colA || !colB) return;
    
    // Circle-circle collision detection
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const combinedRadius = colA.radius + colB.radius;
    
    if (distance < combinedRadius) {
      // Collision detected! Determine what type of interaction this is
      this.handleCollisionInteraction(entityIdA, entityIdB, entityManager);
    }
  }
  
  /**
   * Handle the gameplay consequences of a collision
   * Learning Focus: How collisions translate to game rules
   */
  private handleCollisionInteraction(entityIdA: string, entityIdB: string, entityManager: EntityManager): void {
    // Get collision layers to determine interaction type
    const colA = entityManager.getComponent<CollisionComponent>(entityIdA, 'collision');
    const colB = entityManager.getComponent<CollisionComponent>(entityIdB, 'collision');
    
    if (!colA || !colB) return;
    
    // Determine interaction based on collision layers
    const interactionKey = this.getInteractionKey(colA.layer, colB.layer);
    
    switch (interactionKey) {
      case 'player:collectible':
        this.handlePlayerCollectible(entityIdA, entityIdB, entityManager);
        break;
        
      case 'player:enemy':
        this.handlePlayerEnemy(entityIdA, entityIdB, entityManager);
        break;
        
      case 'player:wall':
      case 'enemy:wall':
        this.handleSolidCollision(entityIdA, entityIdB, entityManager);
        break;
        
      default:
        // Unknown interaction type - log for debugging
        console.log(`Unknown collision interaction: ${interactionKey}`);
    }
  }
  
  /**
   * Create a consistent interaction key from two collision layers
   */
  private getInteractionKey(layerA: string, layerB: string): string {
    return layerA < layerB ? `${layerA}:${layerB}` : `${layerB}:${layerA}`;
  }
  
  /**
   * Handle player collecting an item
   * Learning Focus: How collisions trigger game state changes
   */
  private handlePlayerCollectible(entityIdA: string, entityIdB: string, entityManager: EntityManager): void {
    // Determine which entity is the player and which is the collectible
    const colA = entityManager.getComponent<CollisionComponent>(entityIdA, 'collision');
    const colB = entityManager.getComponent<CollisionComponent>(entityIdB, 'collision');
    
    let playerId: string, collectibleId: string;
    
    if (colA?.layer === 'player') {
      playerId = entityIdA;
      collectibleId = entityIdB;
    } else {
      playerId = entityIdB;
      collectibleId = entityIdA;
    }
    
    // Get collectible data
    const collectibleData = entityManager.getComponent(collectibleId, 'collectible');
    if (!collectibleData || collectibleData.collected) return;
    
    // Mark as collected
    collectibleData.collected = true;
    
    // Emit collision event for game logic to handle
    const event: CollisionEvent = {
      entityA: playerId,
      entityB: collectibleId,
      type: 'player_collect',
      data: {
        collectibleType: collectibleData.type,
        points: collectibleData.points
      }
    };
    
    this.emitCollisionEvent(event);
    
    // Remove collectible entity
    entityManager.removeEntity(collectibleId);
  }
  
  /**
   * Handle player hitting an enemy
   */
  private handlePlayerEnemy(entityIdA: string, entityIdB: string, entityManager: EntityManager): void {
    // Determine which is player and which is enemy
    const colA = entityManager.getComponent<CollisionComponent>(entityIdA, 'collision');
    const colB = entityManager.getComponent<CollisionComponent>(entityIdB, 'collision');
    
    let playerId: string, enemyId: string;
    
    if (colA?.layer === 'player') {
      playerId = entityIdA;
      enemyId = entityIdB;
    } else {
      playerId = entityIdB;
      enemyId = entityIdA;
    }
    
    // Check if player is invulnerable
    const playerHealth = entityManager.getComponent(playerId, 'health');
    if (playerHealth?.invulnerable) return;
    
    // Emit collision event
    const event: CollisionEvent = {
      entityA: playerId,
      entityB: enemyId,
      type: 'player_enemy_contact',
      data: {
        damage: 25 // Default damage amount
      }
    };
    
    this.emitCollisionEvent(event);
  }
  
  /**
   * Handle solid object collisions (walls, barriers)
   * Learning Focus: Physics response for solid collisions
   */
  private handleSolidCollision(entityIdA: string, entityIdB: string, entityManager: EntityManager): void {
    const posA = entityManager.getComponent<PositionComponent>(entityIdA, 'position');
    const posB = entityManager.getComponent<PositionComponent>(entityIdB, 'position');
    const colA = entityManager.getComponent<CollisionComponent>(entityIdA, 'collision');
    const colB = entityManager.getComponent<CollisionComponent>(entityIdB, 'collision');
    
    if (!posA || !posB || !colA || !colB) return;
    
    // Determine which entity should be moved (typically the non-wall entity)
    let movableId: string, solidId: string;
    
    if (colA.layer === 'wall') {
      movableId = entityIdB;
      solidId = entityIdA;
    } else {
      movableId = entityIdA;
      solidId = entityIdB;
    }
    
    // Calculate separation vector
    const movablePos = entityManager.getComponent<PositionComponent>(movableId, 'position');
    const solidPos = entityManager.getComponent<PositionComponent>(solidId, 'position');
    const movableCol = entityManager.getComponent<CollisionComponent>(movableId, 'collision');
    const solidCol = entityManager.getComponent<CollisionComponent>(solidId, 'collision');
    
    if (!movablePos || !solidPos || !movableCol || !solidCol) return;
    
    const dx = movablePos.x - solidPos.x;
    const dy = movablePos.y - solidPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const overlap = (movableCol.radius + solidCol.radius) - distance;
      const separationX = (dx / distance) * overlap;
      const separationY = (dy / distance) * overlap;
      
      // Move the movable entity out of collision
      movablePos.x += separationX;
      movablePos.y += separationY;
      
      // Stop velocity in collision direction
      const movableMovement = entityManager.getComponent(movableId, 'movement');
      if (movableMovement) {
        // Project velocity onto separation vector and remove that component
        const separationLength = Math.sqrt(separationX * separationX + separationY * separationY);
        if (separationLength > 0) {
          const separationNormalX = separationX / separationLength;
          const separationNormalY = separationY / separationLength;
          
          const velocityDot = movableMovement.velocity.x * separationNormalX + 
                             movableMovement.velocity.y * separationNormalY;
          
          if (velocityDot < 0) { // Moving into the collision
            movableMovement.velocity.x -= velocityDot * separationNormalX;
            movableMovement.velocity.y -= velocityDot * separationNormalY;
          }
        }
      }
    }
  }
  
  /**
   * Register a collision event handler
   * Learning Focus: How to create modular game rules
   */
  registerCollisionHandler(collisionType: string, handler: (event: CollisionEvent) => void): void {
    this.collisionHandlers.set(collisionType, handler);
  }
  
  /**
   * Emit a collision event to registered handlers
   */
  private emitCollisionEvent(event: CollisionEvent): void {
    const handler = this.collisionHandlers.get(event.type);
    if (handler) {
      handler(event);
    }
  }
  
  /**
   * Get diagnostic information
   */
  getDiagnosticInfo(entityManager: EntityManager): any {
    const collisionEntities = entityManager.getEntitiesWith(this.requiredComponents);
    const gridCells = Array.from(this.spatialGrid.keys()).length;
    const totalGridEntries = Array.from(this.spatialGrid.values())
      .reduce((sum, entities) => sum + entities.length, 0);
    
    return {
      collisionEntities: collisionEntities.length,
      spatialGridCells: gridCells,
      totalGridEntries,
      averageEntitiesPerCell: gridCells > 0 ? (totalGridEntries / gridCells).toFixed(1) : 0,
      registeredHandlers: Array.from(this.collisionHandlers.keys())
    };
  }
}