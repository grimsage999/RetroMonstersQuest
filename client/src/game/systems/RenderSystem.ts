/**
 * Render System - Visual Output
 * 
 * Learning Focus: How gameplay data becomes visual representation
 * This demonstrates the separation between game logic and presentation
 */

import { System } from './System';
import { Entity, EntityManager, PositionComponent, RenderComponent } from '../core/Entity';

export class RenderSystem extends System {
  readonly name = 'RenderSystem';
  readonly requiredComponents = ['position', 'render'];
  
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // Render state tracking
  private drawCallCount = 0;
  private culledEntities = 0;
  
  constructor(canvas: HTMLCanvasElement) {
    super(100); // Render last, after all game logic
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // Set up pixel-perfect rendering for retro style
    this.ctx.imageSmoothingEnabled = false;
  }
  
  /**
   * Render all visible entities
   * Learning Focus: How to efficiently convert game data to visuals
   */
  protected process(entities: Entity[], entityManager: EntityManager, deltaTime: number): void {
    // Reset frame counters
    this.drawCallCount = 0;
    this.culledEntities = 0;
    
    // Clear canvas with game background
    this.clearCanvas();
    
    // Sort entities by z-index for correct layering
    const sortedEntities = this.sortEntitiesByZIndex(entities, entityManager);
    
    // Render each entity
    for (const entity of sortedEntities) {
      this.renderEntity(entity, entityManager);
    }
    
    // Render UI overlay (score, debug info, etc.)
    this.renderUIOverlay(entityManager);
  }
  
  /**
   * Clear canvas and set up for new frame
   */
  private clearCanvas(): void {
    // Save context state
    this.ctx.save();
    
    // Clear entire canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set background color
    this.ctx.fillStyle = '#000011'; // Dark space background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Restore context state
    this.ctx.restore();
  }
  
  /**
   * Sort entities by z-index for proper layering
   * Learning Focus: How to manage visual layering in 2D games
   */
  private sortEntitiesByZIndex(entities: Entity[], entityManager: EntityManager): Entity[] {
    return entities.slice().sort((a, b) => {
      const renderA = entityManager.getComponent<RenderComponent>(a.id, 'render');
      const renderB = entityManager.getComponent<RenderComponent>(b.id, 'render');
      
      const zIndexA = renderA?.zIndex || 0;
      const zIndexB = renderB?.zIndex || 0;
      
      return zIndexA - zIndexB;
    });
  }
  
  /**
   * Render a single entity
   * Learning Focus: How to translate game components to visuals
   */
  private renderEntity(entity: Entity, entityManager: EntityManager): void {
    const position = entityManager.getComponent<PositionComponent>(entity.id, 'position');
    const render = entityManager.getComponent<RenderComponent>(entity.id, 'render');
    
    if (!position || !render) return;
    
    // Frustum culling - don't render entities outside screen
    if (this.isEntityCulled(position, render)) {
      this.culledEntities++;
      return;
    }
    
    // Save context state for this entity
    this.ctx.save();
    
    // Transform to entity position and rotation
    this.ctx.translate(position.x, position.y);
    this.ctx.rotate(position.rotation);
    
    // Render based on render component type
    switch (render.type) {
      case 'sprite':
        this.renderSprite(entity, render, entityManager);
        break;
      case 'shape':
        this.renderShape(entity, render, entityManager);
        break;
      default:
        console.warn(`Unknown render type: ${render.type}`);
    }
    
    // Restore context state
    this.ctx.restore();
    
    this.drawCallCount++;
  }
  
  /**
   * Check if entity is outside screen bounds (frustum culling)
   */
  private isEntityCulled(position: PositionComponent, render: RenderComponent): boolean {
    const margin = Math.max(render.width, render.height) / 2;
    
    return position.x + margin < 0 ||
           position.x - margin > this.canvas.width ||
           position.y + margin < 0 ||
           position.y - margin > this.canvas.height;
  }
  
  /**
   * Render entity as a sprite (placeholder for now)
   * Learning Focus: How to handle different visual representations
   */
  private renderSprite(entity: Entity, render: RenderComponent, entityManager: EntityManager): void {
    // For now, render as colored rectangle
    // In a full game, this would load and draw actual sprite images
    
    this.ctx.fillStyle = render.color;
    this.ctx.fillRect(-render.width / 2, -render.height / 2, render.width, render.height);
    
    // Add visual feedback for different entity types
    this.addEntitySpecificVisuals(entity, render, entityManager);
  }
  
  /**
   * Render entity as a simple shape
   */
  private renderShape(entity: Entity, render: RenderComponent, entityManager: EntityManager): void {
    this.ctx.fillStyle = render.color;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, render.width / 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.addEntitySpecificVisuals(entity, render, entityManager);
  }
  
  /**
   * Add visual feedback based on entity state
   * Learning Focus: How visual feedback enhances gameplay
   */
  private addEntitySpecificVisuals(entity: Entity, render: RenderComponent, entityManager: EntityManager): void {
    // Health visualization
    const health = entityManager.getComponent(entity.id, 'health');
    if (health && health.current < health.max) {
      this.renderHealthBar(health.current, health.max, render.width);
    }
    
    // Invulnerability visual effect
    if (health?.invulnerable) {
      this.renderInvulnerabilityEffect();
    }
    
    // Movement trail for fast-moving entities
    const movement = entityManager.getComponent(entity.id, 'movement');
    if (movement) {
      const speed = Math.sqrt(movement.velocity.x ** 2 + movement.velocity.y ** 2);
      if (speed > 150) {
        this.renderMovementTrail(movement.velocity, speed);
      }
    }
    
    // Collection animation for collectibles
    const collectible = entityManager.getComponent(entity.id, 'collectible');
    if (collectible) {
      this.renderCollectibleEffect();
    }
    
    // AI state visualization (for debugging)
    const ai = entityManager.getComponent(entity.id, 'ai');
    if (ai && this.shouldShowDebugInfo()) {
      this.renderAIDebugInfo(ai);
    }
  }
  
  /**
   * Render health bar above entity
   */
  private renderHealthBar(current: number, max: number, entityWidth: number): void {
    const barWidth = entityWidth;
    const barHeight = 4;
    const yOffset = -entityWidth / 2 - 8;
    
    // Background
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(-barWidth / 2, yOffset, barWidth, barHeight);
    
    // Health fill
    const healthPercent = current / max;
    const fillWidth = barWidth * healthPercent;
    
    if (healthPercent > 0.6) {
      this.ctx.fillStyle = '#4CAF50'; // Green
    } else if (healthPercent > 0.3) {
      this.ctx.fillStyle = '#FF9800'; // Orange
    } else {
      this.ctx.fillStyle = '#F44336'; // Red
    }
    
    this.ctx.fillRect(-barWidth / 2, yOffset, fillWidth, barHeight);
  }
  
  /**
   * Render invulnerability flashing effect
   */
  private renderInvulnerabilityEffect(): void {
    const flash = Math.sin(Date.now() * 0.02) > 0;
    if (flash) {
      this.ctx.globalAlpha = 0.5;
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(-25, -25, 50, 50);
      this.ctx.globalAlpha = 1;
    }
  }
  
  /**
   * Render movement trail effect
   */
  private renderMovementTrail(velocity: {x: number, y: number}, speed: number): void {
    const trailLength = Math.min(speed * 0.3, 50);
    const trailDirection = {
      x: -velocity.x / speed,
      y: -velocity.y / speed
    };
    
    this.ctx.strokeStyle = '#00FFFF';
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.6;
    
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(trailDirection.x * trailLength, trailDirection.y * trailLength);
    this.ctx.stroke();
    
    this.ctx.globalAlpha = 1;
  }
  
  /**
   * Render collectible sparkle effect
   */
  private renderCollectibleEffect(): void {
    const time = Date.now() * 0.005;
    const sparkleRadius = 5 + Math.sin(time) * 2;
    
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.8;
    
    this.ctx.beginPath();
    this.ctx.arc(0, 0, sparkleRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.globalAlpha = 1;
  }
  
  /**
   * Render AI debug information
   */
  private renderAIDebugInfo(ai: any): void {
    this.ctx.fillStyle = '#FFFF00';
    this.ctx.font = '8px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(ai.type, 0, 25);
  }
  
  /**
   * Check if debug info should be shown
   */
  private shouldShowDebugInfo(): boolean {
    // Show debug info if diagnostic dashboard is open or debug key is pressed
    return false; // For now, keep debug info hidden
  }
  
  /**
   * Render UI overlay (scores, etc.)
   */
  private renderUIOverlay(entityManager: EntityManager): void {
    // This would render game UI elements that aren't entities
    // For now, just render performance info in debug mode
    if (this.shouldShowDebugInfo()) {
      this.renderPerformanceInfo();
    }
  }
  
  /**
   * Render performance information for debugging
   */
  private renderPerformanceInfo(): void {
    this.ctx.save();
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    
    const lines = [
      `Draw Calls: ${this.drawCallCount}`,
      `Culled: ${this.culledEntities}`,
      `Canvas: ${this.canvas.width}x${this.canvas.height}`
    ];
    
    lines.forEach((line, index) => {
      this.ctx.fillText(line, 10, 20 + index * 15);
    });
    
    this.ctx.restore();
  }
  
  /**
   * Get diagnostic information
   */
  getDiagnosticInfo(): any {
    return {
      drawCalls: this.drawCallCount,
      culledEntities: this.culledEntities,
      canvasSize: `${this.canvas.width}x${this.canvas.height}`,
      contextProperties: {
        imageSmoothingEnabled: this.ctx.imageSmoothingEnabled,
        globalAlpha: this.ctx.globalAlpha,
        globalCompositeOperation: this.ctx.globalCompositeOperation
      }
    };
  }
}