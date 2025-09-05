interface MovementConfig {
  baseSpeed: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  dashSpeed: number;
  dashDuration: number;
  dashCooldown: number;
}

interface MovementState {
  velocityX: number;
  velocityY: number;
  isDashing: boolean;
  canDash: boolean;
  speed: number;
}

interface MovementUpdate {
  dx: number;
  dy: number;
}

/**
 * Advanced Movement System with acceleration and variable speed
 */
export class MovementSystem {
  // Movement parameters
  private baseSpeed: number = 2; // Base speed in pixels/frame - REDUCED
  private maxSpeed: number = 3; // Maximum speed - REDUCED  
  private acceleration: number = 0.2; // How quickly we reach max speed - REDUCED
  private deceleration: number = 0.15; // How quickly we slow down - REDUCED
  private dashSpeed: number = 6; // Speed during dash - REDUCED
  private dashDuration: number = 200; // Dash duration in ms - INCREASED
  private dashCooldown: number = 800; // Cooldown between dashes in ms - INCREASED

  // Current state
  private velocityX: number = 0;
  private velocityY: number = 0;
  private isDashing: boolean = false;
  private dashTimer: number = 0;
  private dashCooldownTimer: number = 0;
  private dashDirectionX: number = 0;
  private dashDirectionY: number = 0;

  constructor() {
    // Initialize with default values
  }

  /**
   * Update movement based on input
   */
  update(
    inputX: number, // -1, 0, or 1
    inputY: number, // -1, 0, or 1
    isDashPressed: boolean,
    deltaTime: number
  ): MovementUpdate {
    // Update dash cooldown
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= deltaTime;
    }

    // Handle dash
    if (isDashPressed && !this.isDashing && this.dashCooldownTimer <= 0 && (inputX !== 0 || inputY !== 0)) {
      this.startDash(inputX, inputY);
    }

    // Update dash state
    if (this.isDashing) {
      this.dashTimer -= deltaTime;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    if (this.isDashing) {
      // During dash, use dash velocity
      return {
        dx: this.dashDirectionX * this.dashSpeed,
        dy: this.dashDirectionY * this.dashSpeed
      };
    } else {
      // Normal movement with acceleration
      return this.updateNormalMovement(inputX, inputY, deltaTime);
    }
  }

  /**
   * Update normal movement with acceleration/deceleration
   */
  private updateNormalMovement(inputX: number, inputY: number, deltaTime: number): { dx: number; dy: number } {
    // Target velocity based on input
    const targetVelX = inputX * this.maxSpeed;
    const targetVelY = inputY * this.maxSpeed;

    // Apply acceleration or deceleration
    if (inputX !== 0) {
      // Accelerate towards target velocity
      const diff = targetVelX - this.velocityX;
      this.velocityX += diff * this.acceleration;
    } else {
      // Decelerate to zero
      this.velocityX *= (1 - this.deceleration);
      if (Math.abs(this.velocityX) < 0.1) {
        this.velocityX = 0;
      }
    }

    if (inputY !== 0) {
      // Accelerate towards target velocity
      const diff = targetVelY - this.velocityY;
      this.velocityY += diff * this.acceleration;
    } else {
      // Decelerate to zero
      this.velocityY *= (1 - this.deceleration);
      if (Math.abs(this.velocityY) < 0.1) {
        this.velocityY = 0;
      }
    }

    // Apply diagonal movement normalization
    if (inputX !== 0 && inputY !== 0) {
      const magnitude = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
      if (magnitude > this.maxSpeed) {
        this.velocityX = (this.velocityX / magnitude) * this.maxSpeed;
        this.velocityY = (this.velocityY / magnitude) * this.maxSpeed;
      }
    }

    return {
      dx: this.velocityX,
      dy: this.velocityY
    };
  }

  /**
   * Start a dash in the given direction
   */
  private startDash(inputX: number, inputY: number): void {
    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.dashCooldownTimer = this.dashCooldown;

    // Normalize dash direction
    const magnitude = Math.sqrt(inputX * inputX + inputY * inputY);
    this.dashDirectionX = inputX / magnitude;
    this.dashDirectionY = inputY / magnitude;
  }

  /**
   * Reset movement state
   */
  reset(): void {
    this.velocityX = 0;
    this.velocityY = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
  }

  /**
   * Get current movement state
   */
  getState(): MovementState {
    const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
    
    return {
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      isDashing: this.isDashing,
      canDash: this.dashCooldownTimer <= 0,
      speed: Math.round(speed * 100) / 100
    };
  }

  /**
   * Configure movement parameters
   */
  configure(params: Partial<MovementConfig>): void {
    if (params.baseSpeed !== undefined) this.baseSpeed = params.baseSpeed;
    if (params.maxSpeed !== undefined) this.maxSpeed = params.maxSpeed;
    if (params.acceleration !== undefined) this.acceleration = params.acceleration;
    if (params.deceleration !== undefined) this.deceleration = params.deceleration;
    if (params.dashSpeed !== undefined) this.dashSpeed = params.dashSpeed;
    if (params.dashDuration !== undefined) this.dashDuration = params.dashDuration;
    if (params.dashCooldown !== undefined) this.dashCooldown = params.dashCooldown;
  }
}