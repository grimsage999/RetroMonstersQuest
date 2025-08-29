/**
 * System Architecture - How Game Logic is Organized
 * 
 * Learning Focus: Systems process components, not entities
 * This demonstrates data-oriented design for gameplay
 */

import { Entity, ComponentType, EntityManager } from '../core/Entity';

export abstract class System {
  /**
   * Which components this system requires to process an entity
   * This is the key insight: systems work on data, not object types
   */
  abstract readonly requiredComponents: ComponentType[];
  
  /**
   * System name for debugging and profiling
   */
  abstract readonly name: string;
  
  /**
   * Update priority - lower numbers run first
   * This allows ordering systems logically (input -> logic -> rendering)
   */
  readonly priority: number = 0;
  
  /**
   * Whether this system is currently enabled
   */
  enabled: boolean = true;
  
  /**
   * Performance tracking for diagnostic purposes
   */
  private performanceMetrics = {
    totalTime: 0,
    callCount: 0,
    lastFrameTime: 0
  };
  
  constructor(priority: number = 0) {
    this.priority = priority;
  }
  
  /**
   * Main update method - called every frame
   * The entity manager provides entities that match our requirements
   */
  update(entityManager: EntityManager, deltaTime: number): void {
    if (!this.enabled) return;
    
    const startTime = performance.now();
    
    // Get entities that have all required components
    const entities = entityManager.getEntitiesWith(this.requiredComponents);
    
    // Process entities - this is where the actual game logic happens
    this.process(entities, entityManager, deltaTime);
    
    // Track performance for diagnostics
    const endTime = performance.now();
    this.performanceMetrics.lastFrameTime = endTime - startTime;
    this.performanceMetrics.totalTime += this.performanceMetrics.lastFrameTime;
    this.performanceMetrics.callCount++;
  }
  
  /**
   * The actual system logic - implemented by each system
   */
  protected abstract process(
    entities: Entity[], 
    entityManager: EntityManager, 
    deltaTime: number
  ): void;
  
  /**
   * Called when system is added to the game
   */
  onAdded(): void {
    // Override in subclasses if needed
  }
  
  /**
   * Called when system is removed from the game
   */
  onRemoved(): void {
    // Override in subclasses if needed
  }
  
  /**
   * Get performance metrics for diagnostic dashboard
   */
  getPerformanceMetrics(): any {
    const avgTime = this.performanceMetrics.callCount > 0 
      ? this.performanceMetrics.totalTime / this.performanceMetrics.callCount 
      : 0;
      
    return {
      name: this.name,
      averageTime: avgTime.toFixed(3),
      lastFrameTime: this.performanceMetrics.lastFrameTime.toFixed(3),
      callCount: this.performanceMetrics.callCount,
      enabled: this.enabled
    };
  }
  
  /**
   * Reset performance tracking
   */
  resetMetrics(): void {
    this.performanceMetrics = {
      totalTime: 0,
      callCount: 0,
      lastFrameTime: 0
    };
  }
}

/**
 * System Manager - Coordinates all game systems
 * 
 * Learning Focus: How to organize multiple systems efficiently
 */
export class SystemManager {
  private systems: System[] = [];
  private systemsByName: Map<string, System> = new Map();
  
  /**
   * Add a system to the game
   */
  addSystem(system: System): void {
    this.systems.push(system);
    this.systemsByName.set(system.name, system);
    
    // Sort by priority so they run in correct order
    this.systems.sort((a, b) => a.priority - b.priority);
    
    system.onAdded();
    console.log(`System added: ${system.name} (priority: ${system.priority})`);
  }
  
  /**
   * Remove a system from the game
   */
  removeSystem(name: string): boolean {
    const system = this.systemsByName.get(name);
    if (!system) return false;
    
    system.onRemoved();
    this.systems = this.systems.filter(s => s !== system);
    this.systemsByName.delete(name);
    
    console.log(`System removed: ${name}`);
    return true;
  }
  
  /**
   * Get a system by name
   */
  getSystem<T extends System>(name: string): T | null {
    return this.systemsByName.get(name) as T || null;
  }
  
  /**
   * Update all systems in priority order
   * This is called once per frame from the main game loop
   */
  update(entityManager: EntityManager, deltaTime: number): void {
    for (const system of this.systems) {
      if (system.enabled) {
        system.update(entityManager, deltaTime);
      }
    }
  }
  
  /**
   * Enable/disable a system
   */
  setSystemEnabled(name: string, enabled: boolean): void {
    const system = this.systemsByName.get(name);
    if (system) {
      system.enabled = enabled;
      console.log(`System ${name} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
  
  /**
   * Get all system performance metrics for diagnostics
   */
  getPerformanceReport(): any[] {
    return this.systems.map(system => system.getPerformanceMetrics());
  }
  
  /**
   * Reset all performance metrics
   */
  resetAllMetrics(): void {
    this.systems.forEach(system => system.resetMetrics());
  }
  
  /**
   * Get systems sorted by performance impact
   */
  getPerformanceBottlenecks(): any[] {
    const metrics = this.getPerformanceReport();
    return metrics
      .filter(m => m.enabled)
      .sort((a, b) => parseFloat(b.lastFrameTime) - parseFloat(a.lastFrameTime))
      .slice(0, 5); // Top 5 most expensive systems
  }
  
  /**
   * Diagnostic info for debug dashboard
   */
  getDiagnosticInfo(): any {
    return {
      totalSystems: this.systems.length,
      enabledSystems: this.systems.filter(s => s.enabled).length,
      systemNames: this.systems.map(s => s.name),
      performanceBottlenecks: this.getPerformanceBottlenecks()
    };
  }
  
  /**
   * Emergency system shutdown for error recovery
   */
  emergencyShutdown(): void {
    console.warn('SystemManager: Emergency shutdown initiated');
    this.systems.forEach(system => {
      system.enabled = false;
    });
  }
}