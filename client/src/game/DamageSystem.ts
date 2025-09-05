import { GAME_CONFIG } from './GameConfig';

/**
 * Damage System with invincibility frames
 * Prevents multiple damage instances from a single collision
 */

export interface DamageEvent {
  source: string;
  amount: number;
  timestamp: number;
  position: { x: number; y: number };
}

export class DamageSystem {
  private health: number;
  private maxHealth: number;
  private invincibilityDuration: number = GAME_CONFIG.DAMAGE.INVINCIBILITY_DURATION;
  private invincibilityTimer: number = 0;
  public isInvincible: boolean = false;
  private lastDamageEvent: DamageEvent | null = null;
  private damageHistory: DamageEvent[] = [];
  private flashTimer: number = 0;
  private flashDuration: number = GAME_CONFIG.DAMAGE.FLASH_DURATION;
  private onDamage: ((health: number, maxHealth: number) => void) | null = null;
  private onDeath: (() => void) | null = null;

  constructor(maxHealth: number = 3) {
    this.maxHealth = maxHealth;
    this.health = maxHealth;
  }

  /**
   * Apply damage to the player with invincibility check
   */
  takeDamage(source: string, amount: number = 1, position?: { x: number; y: number }): boolean {
    // CRITICAL BUG FIX: Check if player is invincible
    if (this.isInvincible) {
      return false;
    }

    // CRITICAL BUG FIX: Prevent multiple damage from same source in short time window
    const currentTime = Date.now();
    if (this.lastDamageEvent && 
        this.lastDamageEvent.source === source && 
        (currentTime - this.lastDamageEvent.timestamp) < 100) {
      return false; // Too soon for another hit from same source
    }

    // Validate damage amount
    if (amount <= 0) {
      // Invalid damage amount
      return false;
    }

    // Apply damage
    const previousHealth = this.health;
    this.health = Math.max(0, this.health - amount);

    // Record damage event
    const damageEvent: DamageEvent = {
      source,
      amount,
      timestamp: Date.now(),
      position: position || { x: 0, y: 0 }
    };

    try {
      this.lastDamageEvent = damageEvent;
      this.damageHistory.push(damageEvent);

      // Keep only last 10 damage events for debugging
      if (this.damageHistory.length > 10) {
        this.damageHistory.shift();
      }
    } catch (error) {
      console.error('DamageSystem: Error updating damage history:', error);
      // Fallback: at least record the damage event even if history fails
      this.lastDamageEvent = damageEvent;
    }

    console.log(`Player took ${amount} damage from ${source}. Health: ${this.health}/${this.maxHealth}`);

    // Activate invincibility
    this.activateInvincibility();

    // Trigger flash effect
    this.flashTimer = this.flashDuration;

    // Notify damage callback with error handling
    if (this.onDamage) {
      try {
        this.onDamage(this.health, this.maxHealth);
      } catch (error) {
        console.error('DamageSystem: Error in onDamage callback:', error);
      }
    }

    // Check for death with error handling
    if (this.health <= 0 && this.onDeath) {
      console.log('Player defeated!');
      try {
        this.onDeath();
      } catch (error) {
        console.error('DamageSystem: Error in onDeath callback:', error);
      }
    }

    return true;
  }

  /**
   * Activate invincibility frames
   */
  private activateInvincibility(): void {
    this.isInvincible = true;
    this.invincibilityTimer = this.invincibilityDuration;
    console.log(`Invincibility activated for ${this.invincibilityDuration}ms`);
  }

  /**
   * Update the damage system (call every frame)
   */
  update(deltaTime: number): void {
    // Update invincibility timer
    if (this.isInvincible && this.invincibilityTimer > 0) {
      this.invincibilityTimer -= deltaTime;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
        this.invincibilityTimer = 0;
        console.log('Invincibility expired');
      }
    }

    // Update flash timer
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
    }
  }

  /**
   * Check if player should be rendered with invincibility effect
   */
  shouldRenderInvincibility(): boolean {
    if (!this.isInvincible) return false;
    
    // Blink effect during invincibility
    const blinkInterval = 100; // Blink every 100ms
    return Math.floor(this.invincibilityTimer / blinkInterval) % 2 === 0;
  }

  /**
   * Check if damage flash should be shown
   */
  shouldShowDamageFlash(): boolean {
    return this.flashTimer > 0;
  }

  /**
   * Heal the player
   */
  heal(amount: number): void {
    const previousHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    
    if (this.health > previousHealth) {
      console.log(`Player healed ${this.health - previousHealth} HP. Health: ${this.health}/${this.maxHealth}`);
      
      if (this.onDamage) {
        this.onDamage(this.health, this.maxHealth);
      }
    }
  }

  /**
   * Reset health to maximum
   */
  reset(): void {
    this.health = this.maxHealth;
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.flashTimer = 0;
    this.lastDamageEvent = null;
    this.damageHistory = [];
    console.log(`Health reset to ${this.health}/${this.maxHealth}`);
  }

  /**
   * Set damage callback
   */
  setOnDamage(callback: (health: number, maxHealth: number) => void): void {
    this.onDamage = callback;
  }

  /**
   * Set death callback
   */
  setOnDeath(callback: () => void): void {
    this.onDeath = callback;
  }

  /**
   * Get current health
   */
  getHealth(): number {
    return this.health;
  }

  /**
   * Get max health
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Check if invincible
   */
  isPlayerInvincible(): boolean {
    return this.isInvincible;
  }

  /**
   * Get invincibility progress (0-1)
   */
  getInvincibilityProgress(): number {
    if (!this.isInvincible) return 0;
    return this.invincibilityTimer / this.invincibilityDuration;
  }

  /**
   * Get damage history for debugging
   */
  getDamageHistory(): DamageEvent[] {
    return [...this.damageHistory];
  }

  /**
   * Get last damage event
   */
  getLastDamageEvent(): DamageEvent | null {
    return this.lastDamageEvent;
  }

  /**
   * Configure damage system
   */
  configure(options: {
    invincibilityDuration?: number;
    flashDuration?: number;
  }): void {
    if (options.invincibilityDuration !== undefined) {
      this.invincibilityDuration = options.invincibilityDuration;
    }
    if (options.flashDuration !== undefined) {
      this.flashDuration = options.flashDuration;
    }
  }
}