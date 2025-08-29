/**
 * Input System - Connecting Infrastructure to Gameplay
 * 
 * Learning Focus: How to bridge web input events to game entity behavior
 * This demonstrates the integration pattern between your infrastructure and gameplay
 */

import { System } from './System';
import { Entity, EntityManager, PositionComponent, MovementComponent } from '../core/Entity';

export class InputSystem extends System {
  readonly name = 'InputSystem';
  readonly requiredComponents = ['input', 'movement'];
  
  // Track key states - this bridges DOM events to game state
  private keyStates: Map<string, boolean> = new Map();
  private domListenersAttached = false;
  
  constructor() {
    super(-100); // High priority - input should be processed first
  }
  
  /**
   * Set up DOM event listeners when system is added
   * This connects your infrastructure (DOM events) to gameplay (entity components)
   */
  onAdded(): void {
    if (!this.domListenersAttached) {
      this.attachDOMListeners();
      this.domListenersAttached = true;
    }
  }
  
  /**
   * Clean up DOM listeners when system is removed
   */
  onRemoved(): void {
    if (this.domListenersAttached) {
      this.detachDOMListeners();
      this.domListenersAttached = false;
    }
  }
  
  /**
   * Attach keyboard event listeners
   */
  private attachDOMListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Prevent default behavior for game keys
    document.addEventListener('keydown', (e) => {
      if (this.isGameKey(e.code)) {
        e.preventDefault();
      }
    });
    
    console.log('InputSystem: DOM listeners attached');
  }
  
  /**
   * Remove keyboard event listeners
   */
  private detachDOMListeners(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    console.log('InputSystem: DOM listeners detached');
  }
  
  /**
   * Handle key press events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    this.keyStates.set(event.code, true);
  }
  
  /**
   * Handle key release events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    this.keyStates.set(event.code, false);
  }
  
  /**
   * Check if a key code is used by the game
   */
  private isGameKey(code: string): boolean {
    const gameKeys = [
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'Space', 'KeyX'
    ];
    return gameKeys.includes(code);
  }
  
  /**
   * Process input for all entities with input components
   * This is where DOM key states become entity movement
   */
  protected process(entities: Entity[], entityManager: EntityManager, deltaTime: number): void {
    for (const entity of entities) {
      this.processEntityInput(entity, entityManager, deltaTime);
    }
  }
  
  /**
   * Process input for a single entity
   * Learning Focus: How input translates to component data changes
   */
  private processEntityInput(entity: Entity, entityManager: EntityManager, deltaTime: number): void {
    const inputData = entityManager.getComponent(entity.id, 'input');
    const movementData = entityManager.getComponent<MovementComponent>(entity.id, 'movement');
    
    if (!inputData || !movementData) return;
    
    // Calculate movement input - this is the key translation step
    let inputX = 0;
    let inputY = 0;
    
    // Check each direction key
    if (this.isKeyPressed(inputData.keys.up)) {
      inputY = -1; // Negative Y is up in screen coordinates
    }
    if (this.isKeyPressed(inputData.keys.down)) {
      inputY = 1;
    }
    if (this.isKeyPressed(inputData.keys.left)) {
      inputX = -1;
    }
    if (this.isKeyPressed(inputData.keys.right)) {
      inputX = 1;
    }
    
    // Normalize diagonal movement so it doesn't go faster
    if (inputX !== 0 && inputY !== 0) {
      const length = Math.sqrt(inputX * inputX + inputY * inputY);
      inputX /= length;
      inputY /= length;
    }
    
    // Apply input to movement component
    // This demonstrates how input becomes gameplay behavior
    const targetVelocityX = inputX * movementData.speed;
    const targetVelocityY = inputY * movementData.speed;
    
    // Smooth acceleration towards target velocity
    const acceleration = movementData.acceleration * deltaTime;
    
    movementData.velocity.x = this.lerp(
      movementData.velocity.x, 
      targetVelocityX, 
      acceleration
    );
    movementData.velocity.y = this.lerp(
      movementData.velocity.y, 
      targetVelocityY, 
      acceleration
    );
    
    // Apply friction when no input
    if (inputX === 0) {
      movementData.velocity.x *= Math.pow(movementData.friction, deltaTime);
    }
    if (inputY === 0) {
      movementData.velocity.y *= Math.pow(movementData.friction, deltaTime);
    }
    
    // Store input state for other systems to use
    const currentInput = {
      x: inputX,
      y: inputY,
      hasInput: inputX !== 0 || inputY !== 0
    };
    
    // Update input component with current state
    inputData.currentInput = currentInput;
  }
  
  /**
   * Check if any key in a key array is pressed
   */
  private isKeyPressed(keys: string[]): boolean {
    return keys.some(key => this.keyStates.get(key) === true);
  }
  
  /**
   * Linear interpolation helper for smooth movement
   */
  private lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * Math.min(factor, 1);
  }
  
  /**
   * Get current input state for debugging
   */
  getCurrentInputState(): any {
    const activeKeys = Array.from(this.keyStates.entries())
      .filter(([key, pressed]) => pressed)
      .map(([key]) => key);
    
    return {
      activeKeys,
      totalTrackedKeys: this.keyStates.size
    };
  }
  
  /**
   * Manual input injection for mobile controls or testing
   * This shows how to maintain the same interface for different input sources
   */
  injectInput(key: string, pressed: boolean): void {
    this.keyStates.set(key, pressed);
  }
  
  /**
   * Clear all input states (useful for pausing or menu transitions)
   */
  clearInputs(): void {
    this.keyStates.clear();
  }
}