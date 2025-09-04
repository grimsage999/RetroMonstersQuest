/**
 * Game Configuration Constants
 * Centralized location for all game-related constants and magic numbers
 */

export const GAME_CONFIG = {
  // Player Configuration
  PLAYER: {
    INITIAL_LIVES: 3,
    STARTING_Y_OFFSET: 50,
    COLLISION_SIZE: 48,
  },

  // Weapon Configuration
  WEAPONS: {
    RAY_GUN: {
      BULLET_SPEED: -8,
      DAMAGE: 10,
      UNLOCK_LEVEL: 3,
    },
    ADJUDICATOR: {
      DAMAGE: 25,
      COOLDOWN: 5000, // 5 seconds
      UNLOCK_LEVEL: 5,
    },
  },

  // Boss Configuration
  BOSS: {
    INITIAL_HEALTH: 100,
    SPAWN_LEVEL: 5,
    PHASE_1_THRESHOLD: 66,
    PHASE_2_THRESHOLD: 33,
    DEFEAT_THRESHOLD: 0,
  },

  // Scoring Configuration
  SCORING: {
    COOKIE_POINTS: 10,
    ENEMY_HIT_POINTS: 50,
    BOSS_HIT_POINTS: 100,
  },

  // Timing Configuration
  TIMING: {
    CUTSCENE_AUTO_ADVANCE: 4500, // 4.5 seconds
    ADJUDICATOR_COOLDOWN: 5000,
    LEVEL_COMPLETE_DELAY: 2000,
    VICTORY_DELAY: 1000,
    GAME_OVER_DELAY: 1000,
  },

  // Audio Configuration
  AUDIO: {
    BACKGROUND_MUSIC_VOLUME: 0.3,
    HIT_SOUND_VOLUME: 0.5,
    SUCCESS_SOUND_VOLUME: 0.7,
    POOL_SIZE: 5,
  },

  // Movement Configuration
  MOVEMENT: {
    BASE_SPEED: 4,
    MAX_SPEED: 6,
    ACCELERATION: 0.25,
    DECELERATION: 0.15,
    DASH_SPEED: 10,
    DASH_DURATION: 200,
    DASH_COOLDOWN: 800,
  },

  // Damage System Configuration
  DAMAGE: {
    INVINCIBILITY_DURATION: 1500, // 1.5 seconds
    FLASH_DURATION: 100,
  },

  // Collision Configuration
  COLLISION: {
    BULLET_RADIUS: 6,
    SPATIAL_GRID_CELL_SIZE: 100,
    MIN_CANVAS_WIDTH: 800,
    MIN_CANVAS_HEIGHT: 600,
  },

  // Transition Configuration
  TRANSITIONS: {
    FADE_OUT_DURATION: 1000,
    FADE_IN_DURATION: 800,
    LOADING_DURATION: 1000,
    LEVEL_CARD_DURATION: 2000,
    TRANSITION_BUFFER: 500,
  },

  // Boss State Timings
  BOSS_TIMINGS: {
    INTRO_PHASE_1: 2000,
    INTRO_PHASE_2: 4000,
    PHASE_1_ATTACK_INTERVAL: 2000,
    PHASE_1_MAX_ATTACKS: 10,
    PHASE_2_CHARGE_INTERVAL: 4000,
    PHASE_2_CHARGE_DURATION: 1500,
    FINAL_PHASE_ATTACK_FREQUENCY: 500,
    DEFEATED_ANIMATION_DURATION: 3000,
  },

  // Performance Configuration
  PERFORMANCE: {
    MAX_HISTORY_SIZE: 100,
    MAX_STATE_HISTORY: 20,
    MAX_METRICS_HISTORY: 60,
    DEFAULT_DELTA_TIME: 16,
    MIN_DELTA_TIME: 1,
  },

  // Animation Configuration
  ANIMATION: {
    ENEMY_FRAME_DURATION: 400,
    CUTSCENE_FADE_DURATION: 800,
    CUTSCENE_STAR_DELAY: 200,
    CUTSCENE_STAR_DURATION: 600,
    CUTSCENE_TITLE_DELAY: 400,
    CUTSCENE_TITLE_DURATION: 800,
    CUTSCENE_DESCRIPTION_DELAY: 800,
    CUTSCENE_DESCRIPTION_DURATION: 600,
    CONTINUE_PROMPT_PULSE_DURATION: 500,
  },
} as const;

export const LEVEL_CONFIGS = {
  1: {
    background: '#4A90E2', // Cosmic blue from moodboard
    fbiAgents: 8,
    armyMen: 0,
    radioactiveRats: 0,
    zombies: 0,
    cookies: 8,
    title: 'Level 1: Cosmic Desert Landing',
    description: 'Alien crash site with colorful crystal formations and floating space debris',
    starField: true,
    cosmicColors: ['#FF6B9D', '#4ECDC4', '#45B7D1']
  },
  2: {
    background: '#7B68EE', // Purple cosmic city
    fbiAgents: 10,
    armyMen: 8,
    radioactiveRats: 0,
    zombies: 0,
    cookies: 12,
    title: 'Level 2: Neon Space Station',
    description: 'Futuristic city with holographic signs and alien technology',
    starField: true,
    cosmicColors: ['#FF69B4', '#00CED1', '#9370DB']
  },
  3: {
    background: '#2E8B57', // Green mushroom forest inspired
    fbiAgents: 8,
    armyMen: 4,
    radioactiveRats: 6,
    zombies: 0,
    cookies: 12,
    title: 'Level 3: Underground Mushroom Caverns',
    description: 'Glowing fungi and bioluminescent creatures in cosmic caves',
    starField: false,
    cosmicColors: ['#98FB98', '#FF6347', '#40E0D0']
  },
  4: {
    background: '#8A2BE2', // Deep purple space
    fbiAgents: 6,
    armyMen: 0,
    radioactiveRats: 8,
    zombies: 4,
    cookies: 14,
    title: 'Level 4: Haunted Nebula',
    description: 'Spooky space graveyard with floating ghost ships and cosmic storms',
    starField: true,
    cosmicColors: ['#DA70D6', '#FFB6C1', '#87CEEB']
  },
  5: {
    background: '#191970', // Midnight blue for final cosmic battle
    fbiAgents: 6,
    armyMen: 4,
    radioactiveRats: 8,
    zombies: 6,
    cookies: 18,
    title: 'Level 5: The Cosmic Core',
    description: 'Heart of the universe where cookies were first created',
    starField: true,
    cosmicColors: ['#FFD700', '#FF1493', '#00FF7F'],
    finalLevel: true
  }
} as const;

export const CUTSCENE_DATA = {
  1: {
    levelNumber: 1,
    title: "👽 COSMIC PLAYGROUND 🛸",
    description: "Cosmo crash-landed in Roswell!\nThe CIA hoards cookies - encoded joy itself.\nReclaim happiness through cosmic resistance!\n\nUse arrow keys to move • Collect all cookies • Avoid agents • Reach the finish!"
  },
  2: {
    levelNumber: 2,
    title: "Level 2: Dystopian City",
    description: "Government forces mobilize across crumbling streets.\nCracked pavement, neon signs, and surveillance everywhere.\nAmbient citizens watch from windows as you flee."
  },
  3: {
    levelNumber: 3,
    title: "Level 3: Abandoned Subway",
    description: "Underground tunnels echo with danger.\nRadioactive rats emerge from dark corners.\nIn the debris, you discover alien technology...",
    weaponUnlocked: "🚀 ENHANCED AGILITY 🚀\nCosmo's movement becomes more responsive!\nDodge faster and collect more cookies!"
  },
  4: {
    levelNumber: 4,
    title: "Level 4: Graveyard of the Fallen", 
    description: "Government experiments created unholy abominations.\nZombies shamble between crooked tombstones.\nMist swirls as the undead hunt for fresh victims."
  },
  5: {
    levelNumber: 5,
    title: "Level 5: Government Lab",
    description: "The sterile facility hides dark secrets.\nInteract with lab equipment to uncover fragments.\nSomewhere here lies The Adjudicator...",
    weaponUnlocked: "🌟 COSMIC MASTERY 🌟\nCosmo reaches peak performance!\nUltimate speed and agility unlocked!"
  }
} as const;