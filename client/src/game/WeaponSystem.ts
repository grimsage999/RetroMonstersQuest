/**
 * CRITICAL: Weapon System Implementation as requested
 * Ray Gun and Adjudicator weapon mechanics
 */

export interface Projectile {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  damage: number;
  maxHits: number;
  currentHits: number;
  width: number;
  height: number;
}

export class WeaponSystem {
  private rayGunUnlocked: boolean = false;
  private adjudicatorUnlocked: boolean = false;
  private projectiles: Projectile[] = [];
  private rayGunCooldown: number = 0;
  private adjudicatorCooldown: number = 0;
  private readonly RAY_GUN_COOLDOWN = 250; // 250ms between shots
  private readonly ADJUDICATOR_COOLDOWN = 5000; // 5 second cooldown

  /**
   * Update weapon system
   */
  update(deltaTime: number, inputManager: any, playerX: number, playerY: number, playerWidth: number, playerHeight: number) {
    // Update cooldowns
    if (this.rayGunCooldown > 0) {
      this.rayGunCooldown -= deltaTime;
    }
    if (this.adjudicatorCooldown > 0) {
      this.adjudicatorCooldown -= deltaTime;
    }

    // CRITICAL: Ray Gun firing (Spacebar when unlocked and not jumping)
    if (inputManager.isKeyPressed(' ') && this.rayGunUnlocked && this.rayGunCooldown <= 0) {
      this.fireRayGun(playerX, playerY, playerWidth, playerHeight);
    }

    // CRITICAL: Adjudicator firing (X key when unlocked)
    if (inputManager.isKeyPressed('x') && this.adjudicatorUnlocked && this.adjudicatorCooldown <= 0) {
      this.fireAdjudicator(playerX, playerY, playerWidth, playerHeight);
    }

    // Update all projectiles
    this.updateProjectiles(deltaTime);
  }

  /**
   * CRITICAL: Ray Gun implementation - 3-hit enemy kill mechanic
   */
  private fireRayGun(playerX: number, playerY: number, playerWidth: number, playerHeight: number) {
    const projectile: Projectile = {
      x: playerX + playerWidth / 2,
      y: playerY + playerHeight / 2,
      velocityX: 400, // Pixels per second
      velocityY: 0,
      damage: 1,
      maxHits: 3,
      currentHits: 0,
      width: 4,
      height: 2
    };

    this.projectiles.push(projectile);
    this.rayGunCooldown = this.RAY_GUN_COOLDOWN;
  }

  /**
   * CRITICAL: Adjudicator implementation - instant kill with tracking
   */
  private fireAdjudicator(playerX: number, playerY: number, playerWidth: number, playerHeight: number) {
    const projectile: Projectile = {
      x: playerX + playerWidth / 2,
      y: playerY + playerHeight / 2,
      velocityX: 600, // Faster than Ray Gun
      velocityY: 0,
      damage: 999, // Instant kill
      maxHits: 1,
      currentHits: 0,
      width: 8,
      height: 4
    };

    this.projectiles.push(projectile);
    this.adjudicatorCooldown = this.ADJUDICATOR_COOLDOWN;
  }

  /**
   * Update all projectiles
   */
  private updateProjectiles(deltaTime: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      // Update position
      projectile.x += projectile.velocityX * (deltaTime / 1000);
      projectile.y += projectile.velocityY * (deltaTime / 1000);

      // Remove if off screen or max hits reached
      if (projectile.x > 1000 || projectile.x < -100 || projectile.currentHits >= projectile.maxHits) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  /**
   * CRITICAL: Weapon unlock conditions
   */
  checkWeaponUnlocks(level: number, cookiesCollected: number) {
    // Unlock Ray Gun after collecting cookies in Level 3+
    if (level >= 3 && cookiesCollected > 0 && !this.rayGunUnlocked) {
      this.rayGunUnlocked = true;
      return { unlocked: 'Ray Gun', message: '🔫 Ray Gun unlocked! Press SPACEBAR to fire!' };
    }

    // Unlock Adjudicator in Level 5
    if (level >= 5 && !this.adjudicatorUnlocked) {
      this.adjudicatorUnlocked = true;
      return { unlocked: 'Adjudicator', message: '⚡ Adjudicator unlocked! Press X for instant kill!' };
    }

    return null;
  }

  /**
   * Handle projectile collision with enemy
   */
  checkProjectileCollisions(enemies: any[]): { hit: boolean, enemyIndex: number, damage: number }[] {
    const collisions: { hit: boolean, enemyIndex: number, damage: number }[] = [];

    for (let p = this.projectiles.length - 1; p >= 0; p--) {
      const projectile = this.projectiles[p];
      
      for (let e = 0; e < enemies.length; e++) {
        const enemy = enemies[e];
        
        // Simple collision detection
        if (projectile.x < enemy.x + enemy.width &&
            projectile.x + projectile.width > enemy.x &&
            projectile.y < enemy.y + enemy.height &&
            projectile.y + projectile.height > enemy.y) {
          
          // Hit detected
          projectile.currentHits++;
          collisions.push({
            hit: true,
            enemyIndex: e,
            damage: projectile.damage
          });

          // Remove projectile if max hits reached
          if (projectile.currentHits >= projectile.maxHits) {
            this.projectiles.splice(p, 1);
            break;
          }
        }
      }
    }

    return collisions;
  }

  /**
   * Render weapons and projectiles
   */
  render(ctx: CanvasRenderingContext2D) {
    // Render Ray Gun projectiles
    this.projectiles.forEach(projectile => {
      if (projectile.damage === 1) {
        // Ray Gun projectiles - green
        ctx.fillStyle = '#00FF00';
      } else {
        // Adjudicator projectiles - purple with glow
        ctx.fillStyle = '#FF00FF';
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur = 5;
      }
      
      ctx.fillRect(
        Math.floor(projectile.x), 
        Math.floor(projectile.y), 
        projectile.width, 
        projectile.height
      );
      
      ctx.shadowBlur = 0; // Reset shadow
    });
  }

  /**
   * Get weapon status for UI
   */
  getWeaponStatus() {
    return {
      rayGunUnlocked: this.rayGunUnlocked,
      adjudicatorUnlocked: this.adjudicatorUnlocked,
      rayGunCooldown: Math.max(0, this.rayGunCooldown),
      adjudicatorCooldown: Math.max(0, this.adjudicatorCooldown),
      projectileCount: this.projectiles.length
    };
  }

  /**
   * Reset weapon system
   */
  reset() {
    this.rayGunUnlocked = false;
    this.adjudicatorUnlocked = false;
    this.projectiles = [];
    this.rayGunCooldown = 0;
    this.adjudicatorCooldown = 0;
  }
}