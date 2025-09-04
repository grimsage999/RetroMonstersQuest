
export const GAME_CONFIG = {
  CANVAS: {
    DEFAULT_WIDTH: 800,
    DEFAULT_HEIGHT: 600,
    BACKGROUND_COLOR: '#000011'
  },
  
  PLAYER: {
    DEFAULT_SPEED: 8,
    SIZE: 48,
    STARTING_LIVES: 3
  },
  
  WEAPONS: {
    RAY_GUN: {
      VELOCITY: -8,
      UNLOCK_LEVEL: 3
    },
    ADJUDICATOR: {
      COOLDOWN: 5000,
      UNLOCK_LEVEL: 5,
      DAMAGE: 25
    }
  },
  
  PERFORMANCE: {
    TARGET_FPS: 60,
    LOW_FPS_THRESHOLD: 30,
    SPATIAL_GRID_CELL_SIZE: 100
  },
  
  AUDIO: {
    POOL_SIZES: {
      HIT: 6,
      SUCCESS: 4,
      BACKGROUND: 1
    }
  }
} as const;

export const SPRITE_CONFIG = {
  SCALE: 3,
  ANIMATION_SPEEDS: {
    WALK: 300,
    DASH: 150,
    ENEMY: 400
  }
} as const;

export const COLLISION_CONFIG = {
  BULLET_SIZE: 12,
  BULLET_OFFSET: 6
} as const;
