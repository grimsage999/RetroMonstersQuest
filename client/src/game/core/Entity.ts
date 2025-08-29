/**
 * Entity-Component System - Core Gameplay Architecture
 * 
 * Learning Focus: How ECS differs from OOP inheritance for gameplay
 * This demonstrates composition over inheritance for rapid iteration
 */

export type ComponentType = string;
export type EntityId = string;

export interface Component {
  type: ComponentType;
  data: Record<string, any>;
}

export interface Entity {
  id: EntityId;
  components: Map<ComponentType, Component>;
  active: boolean;
}

/**
 * Core entity creation and management
 * This replaces traditional class hierarchies with flexible composition
 */
export class EntityManager {
  private entities: Map<EntityId, Entity> = new Map();
  private nextId: number = 1;
  
  /**
   * Create a new entity - just an ID and empty component map
   * This is much simpler than complex inheritance hierarchies
   */
  createEntity(customId?: string): Entity {
    const id = customId || `entity_${this.nextId++}`;
    const entity: Entity = {
      id,
      components: new Map(),
      active: true
    };
    
    this.entities.set(id, entity);
    return entity;
  }
  
  /**
   * Add component to entity - this is where the magic happens
   * Instead of modifying classes, we add behavior through components
   */
  addComponent(entityId: EntityId, component: Component): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.components.set(component.type, component);
    }
  }
  
  /**
   * Get component from entity - used by systems
   */
  getComponent<T = any>(entityId: EntityId, type: ComponentType): T | null {
    const entity = this.entities.get(entityId);
    return entity?.components.get(type)?.data as T || null;
  }
  
  /**
   * Remove component - enables dynamic behavior changes
   */
  removeComponent(entityId: EntityId, type: ComponentType): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.components.delete(type);
    }
  }
  
  /**
   * Get entities with specific components - this is how systems find their work
   * Much more flexible than inheritance hierarchies
   */
  getEntitiesWith(componentTypes: ComponentType[]): Entity[] {
    const result: Entity[] = [];
    
    for (const entity of Array.from(this.entities.values())) {
      if (!entity.active) continue;
      
      const hasAllComponents = componentTypes.every(type => 
        entity.components.has(type)
      );
      
      if (hasAllComponents) {
        result.push(entity);
      }
    }
    
    return result;
  }
  
  /**
   * Get entity by ID
   */
  getEntity(id: EntityId): Entity | null {
    return this.entities.get(id) || null;
  }
  
  /**
   * Remove entity completely
   */
  removeEntity(id: EntityId): void {
    this.entities.delete(id);
  }
  
  /**
   * Get all active entities
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values()).filter(e => e.active);
  }
  
  /**
   * Clear all entities (for level transitions)
   */
  clear(): void {
    this.entities.clear();
    this.nextId = 1;
  }
  
  /**
   * Get diagnostic info for debugging
   */
  getDiagnosticInfo(): any {
    const componentCounts = new Map<ComponentType, number>();
    
    for (const entity of Array.from(this.entities.values())) {
      for (const componentType of entity.components.keys()) {
        componentCounts.set(componentType, (componentCounts.get(componentType) || 0) + 1);
      }
    }
    
    return {
      totalEntities: this.entities.size,
      activeEntities: this.getAllEntities().length,
      componentDistribution: Object.fromEntries(componentCounts)
    };
  }
}

/**
 * Factory functions for common entity types
 * These demonstrate how composition creates different "types" of entities
 */
export class EntityFactory {
  constructor(private entityManager: EntityManager) {}
  
  /**
   * Create player entity with core gameplay components
   */
  createPlayer(x: number, y: number): Entity {
    const player = this.entityManager.createEntity('player');
    
    // Position component - where the entity exists in game space
    this.entityManager.addComponent(player.id, {
      type: 'position',
      data: { x, y, rotation: 0 }
    });
    
    // Movement component - how the entity moves
    this.entityManager.addComponent(player.id, {
      type: 'movement',
      data: { 
        speed: 200,           // pixels per second
        acceleration: 800,    // for smooth movement
        velocity: { x: 0, y: 0 },
        friction: 0.8         // for natural stopping
      }
    });
    
    // Collision component - how the entity interacts with others
    this.entityManager.addComponent(player.id, {
      type: 'collision',
      data: {
        radius: 20,
        layer: 'player',
        solid: true
      }
    });
    
    // Input component - responds to player input
    this.entityManager.addComponent(player.id, {
      type: 'input',
      data: {
        keys: {
          up: ['ArrowUp', 'KeyW'],
          down: ['ArrowDown', 'KeyS'],
          left: ['ArrowLeft', 'KeyA'],
          right: ['ArrowRight', 'KeyD']
        }
      }
    });
    
    // Rendering component - how the entity appears
    this.entityManager.addComponent(player.id, {
      type: 'render',
      data: {
        type: 'sprite',
        color: '#00ffff',
        width: 40,
        height: 40,
        zIndex: 10
      }
    });
    
    // Health component - can take damage
    this.entityManager.addComponent(player.id, {
      type: 'health',
      data: {
        current: 100,
        max: 100,
        invulnerable: false,
        invulnerabilityTime: 0
      }
    });
    
    return player;
  }
  
  /**
   * Create cookie entity - demonstrates how simple entities work
   */
  createCookie(x: number, y: number): Entity {
    const cookie = this.entityManager.createEntity();
    
    this.entityManager.addComponent(cookie.id, {
      type: 'position',
      data: { x, y, rotation: 0 }
    });
    
    this.entityManager.addComponent(cookie.id, {
      type: 'collision',
      data: {
        radius: 15,
        layer: 'collectible',
        solid: false
      }
    });
    
    this.entityManager.addComponent(cookie.id, {
      type: 'render',
      data: {
        type: 'sprite',
        color: '#ffaa00',
        width: 30,
        height: 30,
        zIndex: 5
      }
    });
    
    // Special component that makes this collectible
    this.entityManager.addComponent(cookie.id, {
      type: 'collectible',
      data: {
        type: 'cookie',
        points: 100,
        collected: false
      }
    });
    
    // Animation component for visual appeal
    this.entityManager.addComponent(cookie.id, {
      type: 'animation',
      data: {
        type: 'rotation',
        speed: 2, // rotations per second
        currentTime: 0
      }
    });
    
    return cookie;
  }
  
  /**
   * Create basic enemy - demonstrates AI components
   */
  createBasicEnemy(x: number, y: number): Entity {
    const enemy = this.entityManager.createEntity();
    
    this.entityManager.addComponent(enemy.id, {
      type: 'position',
      data: { x, y, rotation: 0 }
    });
    
    this.entityManager.addComponent(enemy.id, {
      type: 'movement',
      data: {
        speed: 100, // Slower than player
        acceleration: 400,
        velocity: { x: 0, y: 0 },
        friction: 0.9
      }
    });
    
    this.entityManager.addComponent(enemy.id, {
      type: 'collision',
      data: {
        radius: 18,
        layer: 'enemy',
        solid: true
      }
    });
    
    this.entityManager.addComponent(enemy.id, {
      type: 'render',
      data: {
        type: 'sprite',
        color: '#ff4444',
        width: 36,
        height: 36,
        zIndex: 8
      }
    });
    
    // AI component - simple follow behavior
    this.entityManager.addComponent(enemy.id, {
      type: 'ai',
      data: {
        type: 'follow_player',
        targetId: 'player',
        detectionRange: 150,
        attackRange: 30,
        lastAttackTime: 0,
        attackCooldown: 1000 // 1 second between attacks
      }
    });
    
    this.entityManager.addComponent(enemy.id, {
      type: 'health',
      data: {
        current: 50,
        max: 50,
        invulnerable: false,
        invulnerabilityTime: 0
      }
    });
    
    return enemy;
  }
}

/**
 * Component type definitions for TypeScript safety
 * This helps maintain type safety while keeping flexibility
 */
export interface PositionComponent {
  x: number;
  y: number;
  rotation: number;
}

export interface MovementComponent {
  speed: number;
  acceleration: number;
  velocity: { x: number; y: number };
  friction: number;
}

export interface CollisionComponent {
  radius: number;
  layer: string;
  solid: boolean;
}

export interface RenderComponent {
  type: 'sprite' | 'shape';
  color: string;
  width: number;
  height: number;
  zIndex: number;
}

export interface HealthComponent {
  current: number;
  max: number;
  invulnerable: boolean;
  invulnerabilityTime: number;
}