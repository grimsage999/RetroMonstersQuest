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
  private invincibilityDuration: number = 1500; // 1.5 seconds of invincibility after hit
  private invincibilityTimer: number = 0;
  private isInvincible: boolean = false;
  private lastDamageEvent: DamageEvent | null = null;
  private damageHistory: DamageEvent[] = [];
  private flashTimer: number = 0;
  private flashDuration: number = 100; // Visual feedback duration
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
    // Check if player is invincible
    if (this.isInvincible) {
      console.log(`Damage blocked by invincibility: ${source}`);
      return false;
    }

    // Validate damage amount
    if (amount <= 0) {
      console.warn(`Invalid damage amount: ${amount}`);
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

    this.lastDamageEvent = damageEvent;
    this.damageHistory.push(damageEvent);

    // Keep only last 10 damage events for debugging
    if (this.damageHistory.length > 10) {
      this.damageHistory.shift();
    }

    console.log(`Player took ${amount} damage from ${source}. Health: ${this.health}/${this.maxHealth}`);

    // Activate invincibility
    this.activateInvincibility();

    // Trigger flash effect
    this.flashTimer = this.flashDuration;

    // Notify damage callback
    if (this.onDamage) {
      this.onDamage(this.health, this.maxHealth);
    }

    // Check for death
    if (this.health <= 0 && this.onDeath) {
      console.log('Player defeated!');
      this.onDeath();
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