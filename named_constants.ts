/**
 * NAMED CONSTANTS FOR COSMIC PLAYGROUND
 * 
 * Replaces all magic numbers with meaningful constants for better readability
 * and easier tuning of game parameters.
 */

/**
 * Canvas and display constants
 */
export const CanvasConstants = {
  WIDTH: 1000,
  HEIGHT: 600,
  MIN_WIDTH: 800,
  MIN_HEIGHT: 600
} as const;

/**
 * Player-related constants
 */
export const PlayerConstants = {
  INITIAL_LIVES: 3,
  START_Y_OFFSET: 50,
  COLLISION_SIZE: 48,
  DEFAULT_SPEED: 5,
  MAX_SPEED: 8,
  DASH_SPEED_MULTIPLIER: 2.25,
  DASH_DURATION: 120,
  DASH_COOLDOWN: 800,
  INVINCIBILITY_DURATION: 1500
} as const;

/**
 * Movement system constants
 */
export const MovementConstants = {
  BASE_SPEED: 6,
  MAX_SPEED: 8,
  ACCELERATION: 0.35,
  DECELERATION: 0.2,
  DASH_SPEED: 18,
  DASH_DURATION: 120,
  DASH_COOLDOWN: 800
} as const;

/**
 * Collision system constants
 */
export const CollisionConstants = {
  SPATIAL_GRID_CELL_SIZE: 100,
  BULLET_RADIUS: 6,
  PLAYER_COLLISION_WIDTH: 48,
  PLAYER_COLLISION_HEIGHT: 48
} as const;

/**
 * Weapon and damage constants
 */
export const WeaponConstants = {
  RAY_GUN: {
    BULLET_SPEED: -8,
    DAMAGE: 10,
    UNLOCK_LEVEL: 3
  },
  ADJUDICATOR: {
    DAMAGE: 25,
    COOLDOWN: 5000, // 5 seconds
    UNLOCK_LEVEL: 5
  }
} as const;

/**
 * Scoring system constants
 */
export const ScoringConstants = {
  COOKIE_POINTS: 10,
  ENEMY_HIT_POINTS: 50,
  BOSS_HIT_POINTS: 100,
  LEVEL_COMPLETE_BONUS: 100
} as const;

/**
 * Timing and duration constants
 */
export const TimingConstants = {
  CUTSCENE_AUTO_ADVANCE: 4500, // 4.5 seconds
  ADJUDICATOR_COOLDOWN: 5000,
  LEVEL_COMPLETE_DELAY: 2000,
  VICTORY_DELAY: 1000,
  GAME_OVER_DELAY: 1000,
  INVINCIBILITY_FLASH_DURATION: 100
} as const;

/**
 * Audio system constants
 */
export const AudioConstants = {
  BACKGROUND_MUSIC_VOLUME: 0.3,
  HIT_SOUND_VOLUME: 0.5,
  SUCCESS_SOUND_VOLUME: 0.7,
  POOL_SIZE: 5,
  HIT_POOL_SIZE: 6,
  SUCCESS_POOL_SIZE: 4,
  BACKGROUND_POOL_SIZE: 1
} as const;

/**
 * Level transition constants
 */
export const TransitionConstants = {
  FADE_OUT_DURATION: 1000,
  FADE_IN_DURATION: 800,
  LOADING_DURATION: 1000,
  LEVEL_CARD_DURATION: 2000,
  TRANSITION_BUFFER: 500
} as const;

/**
 * Animation constants
 */
export const AnimationConstants = {
  ENEMY_FRAME_DURATION: 400,
  PLAYER_WALK_FRAME_DURATION: 250,
  PLAYER_DASH_FRAME_DURATION: 150,
  CUTSCENE_FADE_DURATION: 800,
  CUTSCENE_STAR_DELAY: 200,
  CUTSCENE_STAR_DURATION: 600,
  CUTSCENE_TITLE_DELAY: 400,
  CUTSCENE_TITLE_DURATION: 800,
  CUTSCENE_DESCRIPTION_DELAY: 800,
  CUTSCENE_DESCRIPTION_DURATION: 600,
  CONTINUE_PROMPT_PULSE_DURATION: 500
} as const;

/**
 * Boss-related constants
 */
export const BossConstants = {
  INITIAL_HEALTH: 100,
  SPAWN_LEVEL: 5,
  PHASE_1_THRESHOLD: 66,
  PHASE_2_THRESHOLD: 33,
  DEFEAT_THRESHOLD: 0,
  // Boss timing constants
  INTRO_PHASE_1: 2000,
  INTRO_PHASE_2: 4000,
  PHASE_1_ATTACK_INTERVAL: 2000,
  PHASE_1_MAX_ATTACKS: 10,
  PHASE_2_CHARGE_INTERVAL: 4000,
  PHASE_2_CHARGE_DURATION: 1500,
  FINAL_PHASE_ATTACK_FREQUENCY: 500,
  DEFEATED_ANIMATION_DURATION: 3000
} as const;

/**
 * Performance-related constants
 */
export const PerformanceConstants = {
  MAX_HISTORY_SIZE: 100,
  MAX_STATE_HISTORY: 20,
  MAX_METRICS_HISTORY: 60,
  DEFAULT_DELTA_TIME: 16,
  MIN_DELTA_TIME: 1,
  TARGET_FPS: 60,
  LOW_FPS_THRESHOLD: 30
} as const;

/**
 * Entity-specific constants
 */
export const EnemyConstants = {
  CIA_AGENT: {
    BASE_SPEED: 4,
    WIDTH: 48,
    HEIGHT: 48
  },
  ARMY_MAN: {
    BASE_SPEED: 3,
    WIDTH: 48,
    HEIGHT: 48
  },
  RADIOACTIVE_RAT: {
    BASE_SPEED: 5,
    WIDTH: 36,
    HEIGHT: 36
  },
  ZOMBIE: {
    BASE_SPEED: 2.5,
    WIDTH: 48,
    HEIGHT: 48
  }
} as const;

/**
 * Hazard-related constants
 */
export const HazardConstants = {
  MANHOLE: {
    OPEN_CYCLE_DURATION: 4000,
    OPEN_DURATION: 2000
  },
  DANCING_CACTUS: {
    DEFAULT_AMPLITUDE: 48,
    DEFAULT_SPEED: 2.2
  },
  SPINNING_CACTUS: {
    DEFAULT_SPIN_SPEED: 1.5,
    FIREBALL_INTERVAL: 2.0,
    FIREBALL_SPEED: 4.0
  }
} as const;

/**
 * Text and UI styling constants
 */
export const TextConstants = {
  TITLES: {
    FONT_SIZE: 48,
    OUTLINE_WIDTH: 4,
    SHADOW_OFFSET: 6,
    GLOW_INTENSITY: 8,
    PRIMARY_COLOR: '#FFD700', // Cosmic gold
    OUTLINE_COLOR: '#8A2BE2', // Deep purple
    SHADOW_COLOR: '#FF1493', // Hot pink
    GLOW_COLOR: '#00FFFF' // Cyan glow
  },
  LEVEL_CARDS: {
    FONT_SIZE: 36,
    OUTLINE_WIDTH: 3,
    SHADOW_OFFSET: 4,
    GLOW_INTENSITY: 6,
    PRIMARY_COLOR: '#00FF7F', // Spring green
    OUTLINE_COLOR: '#FF4500', // Orange red
    SHADOW_COLOR: '#4B0082', // Indigo
    GLOW_COLOR: '#FFFF00' // Yellow glow
  },
  DESCRIPTIONS: {
    FONT_SIZE: 18,
    OUTLINE_WIDTH: 2,
    SHADOW_OFFSET: 2,
    GLOW_INTENSITY: 4,
    PRIMARY_COLOR: '#FFFFFF', // White
    OUTLINE_COLOR: '#000000', // Black
    SHADOW_COLOR: '#FF69B4', // Hot pink
    GLOW_COLOR: '#32CD32' // Lime green
  },
  UI_TEXT: {
    FONT_SIZE: 24,
    OUTLINE_WIDTH: 2,
    SHADOW_OFFSET: 3,
    GLOW_INTENSITY: 5,
    PRIMARY_COLOR: '#FF6347', // Tomato
    OUTLINE_COLOR: '#191970', // Midnight blue
    SHADOW_COLOR: '#FF1493', // Deep pink
    GLOW_COLOR: '#00BFFF' // Deep sky blue
  }
} as const;

/**
 * Combined constants namespace for easy access
 */
export const GameConstants = {
  Canvas: CanvasConstants,
  Player: PlayerConstants,
  Movement: MovementConstants,
  Collision: CollisionConstants,
  Weapon: WeaponConstants,
  Scoring: ScoringConstants,
  Timing: TimingConstants,
  Audio: AudioConstants,
  Transition: TransitionConstants,
  Animation: AnimationConstants,
  Boss: BossConstants,
  Performance: PerformanceConstants,
  Enemy: EnemyConstants,
  Hazard: HazardConstants,
  Text: TextConstants
} as const;

/**
 * Example usage in game code:
 * 
 * Instead of: this.canvas.width = 1000;
 * Use: this.canvas.width = CanvasConstants.WIDTH;
 * 
 * Instead of: this.player = new Player(canvas.width / 2, canvas.height - 50);
 * Use: this.player = new Player(canvas.width / 2, canvas.height - PlayerConstants.START_Y_OFFSET);
 * 
 * Instead of: this.spatialGrid = new SpatialGrid(canvas.width, canvas.height, 100);
 * Use: this.spatialGrid = new SpatialGrid(canvas.width, canvas.height, CollisionConstants.SPATIAL_GRID_CELL_SIZE);
 */