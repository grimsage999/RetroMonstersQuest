# Cosmic Playground - Alien Cookie Quest Game

## Overview

This is a 2D HTML5 Canvas game called "Cosmic Playground" where players control a UFO to collect cookies while avoiding enemies. The project is built with a modern React frontend, TypeScript backend using Express, and includes database integration with Drizzle ORM and PostgreSQL. The game features multiple levels with different themes, enemy types, and progressive difficulty.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** for development and build tooling with HMR support
- **Tailwind CSS** for styling with custom design system
- **Radix UI** components for consistent UI elements
- **HTML5 Canvas** for game rendering
- **Zustand** for client-side state management (game state and audio)
- **React Query** for server state management and API calls

### Backend Architecture
- **Express.js** server with TypeScript
- **Drizzle ORM** for database operations with PostgreSQL
- **Session-based architecture** with in-memory storage fallback
- **RESTful API design** with `/api` prefix for all endpoints
- **Development/Production** environment separation

### Game Architecture
- **Object-oriented game engine** with separate classes for Player, Enemy, Level, AudioManager, and InputManager
- **Game loop** with delta time calculations for smooth animations
- **State management** integrated with React using custom hooks
- **Canvas-based rendering** with 2D graphics and animations

## Key Components

### Game Engine Components
- **GameEngine**: Main game controller managing game loop, collision detection, and state transitions
- **Player**: UFO character with movement, animation, and boundary checking
- **Enemy**: Different enemy types (CIA agents, army men, radioactive rats) with AI behavior
- **Level**: Level configuration system with multiple themed environments
- **AudioManager**: Sound effects and background music management
- **InputManager**: Keyboard input handling with support for mobile controls

### Frontend Components
- **GameCanvas**: React wrapper for the HTML5 canvas game
- **GameUI**: Game status display (score, lives, level, cookies collected)
- **Interface**: Game state UI with start/restart/victory screens
- **Audio stores**: Zustand stores for audio state management

### Backend Components
- **Storage abstraction**: Interface-based design supporting both memory and database storage
- **User management**: Basic user schema with authentication structure
- **Route registration**: Modular route system for API endpoints

## Data Flow

1. **Game Initialization**: React component mounts, creates GameEngine instance
2. **Game Loop**: GameEngine runs continuous update/render cycle
3. **Input Processing**: InputManager captures keyboard events, updates player state
4. **Collision Detection**: GameEngine checks player vs enemies/cookies/finish line
5. **State Updates**: Game state changes trigger React state updates
6. **UI Updates**: React re-renders based on game state changes
7. **Audio Management**: Zustand store manages sound playback based on game events

## External Dependencies

### Core Framework Dependencies
- **React ecosystem**: @react-three/fiber, @react-three/drei for potential 3D integration
- **UI Library**: Complete Radix UI component suite for consistent design
- **Styling**: Tailwind CSS with custom configuration
- **State Management**: Zustand with subscriptions, React Query for server state
- **Database**: Drizzle ORM with PostgreSQL (Neon serverless)

### Development Tools
- **Build Tools**: Vite with React plugin, ESBuild for server bundling
- **TypeScript**: Full type coverage for both client and server
- **GLSL Support**: Shader support for advanced graphics (vite-plugin-glsl)
- **Development Experience**: Runtime error overlay, hot module replacement

### Game-Specific Dependencies
- **Canvas APIs**: Native HTML5 Canvas for 2D rendering
- **Audio APIs**: Web Audio API for sound management
- **Animation**: RequestAnimationFrame for smooth game loop

## Deployment Strategy

The application is configured for Replit deployment with the following setup:

### Build Process
- **Development**: `npm run dev` - Runs TypeScript server with Vite dev server
- **Production Build**: `npm run build` - Builds client with Vite, bundles server with ESBuild
- **Production Start**: `npm start` - Runs bundled server

### Environment Configuration
- **Database**: PostgreSQL via Neon serverless (configured in drizzle.config.ts)
- **Server**: Express server serving both API and static files
- **Port Configuration**: Server runs on port 5000, proxied to port 80 in production
- **Static Assets**: Client build output served from `/dist/public`

### Development Features
- **Hot Reload**: Vite dev server with HMR for client-side changes
- **TypeScript Compilation**: Real-time type checking
- **Error Handling**: Runtime error overlay in development
- **Asset Pipeline**: Support for game assets (GLTF, GLB, audio files)

## Changelog

```
Changelog:
- June 26, 2025. Initial setup with basic 2D canvas game
- June 26, 2025. Implemented authentic pixel art style characters (3x scale)
- June 26, 2025. Added weapon systems: Ray Gun (Level 3+) and Adjudicator (Level 5)
- June 26, 2025. Created inviting backgrounds: sunset desert, cyberpunk city, colorful subway
- June 26, 2025. Added smooth walk cycle animations for all characters
- June 26, 2025. Removed visual effects for clean pixel art aesthetic
- July 8, 2025. Implemented complete narrative system with enhanced cutscenes and story arc
- July 8, 2025. Added comprehensive audio feedback system with weapon-specific sounds
- July 8, 2025. Integrated design document specifications: humor + stealth + dodging + retro feedback loops
- July 8, 2025. Added victory epilogue sequence with Halloween sequel tease
- July 8, 2025. Enhanced cookie collection feedback with screen flash and narrative context
- August 21, 2025. Major Performance Optimizations:
  - Implemented Spatial Grid for bullet collision detection (reduces checks by ~70%)
  - Added Audio Pool system to reuse audio instances (prevents memory leaks)
  - Created Sprite Batching system for rendering optimization
  - Integrated advanced Movement System with acceleration, deceleration, and dash mechanic
  - Removed GPU-intensive shadow effects from bullets
  - Added comprehensive performance monitoring metrics
- August 21, 2025. Complete UI State Management Overhaul:
  - Created UIStateController to prevent overlapping UI elements
  - Fixed level transition timing issues - proper delays between screens
  - Separated game over screens from level title cards
  - Implemented transition queue system to prevent button interference
  - Added input blocking during transitions to prevent user interruption
  - Ensured clean state separation with no UI element conflicts
- September 4, 2025. Movement Speed Consistency & Performance Optimization:
  - Fixed frame-rate independent enemy movement using deltaTime normalization
  - Optimized gameOver state rendering to skip expensive operations
  - Implemented batched enemy processing for levels with high enemy counts
  - Simplified complex background rendering (stars, sand dunes) for better FPS
  - Removed artificial frame rate limiting to allow natural browser vsync
  - Ensured consistent 60fps and movement speed across all levels
- October 17, 2025. Level 1-2 "Dancing Desert" with Environmental Hazards:
  - Created DancingCactus hazard class with sine-wave animation and collision detection
  - Added Level 1.5 configuration with 5 evenly-spaced animated cacti as environmental obstacles
  - Integrated hazard collision detection into damage system with invincibility/respawn
  - Implemented LEVEL_SEQUENCE config for proper progression (1 → 1.5 → 2 → 3 → 4 → 5)
  - Added hazard support to Level class with update/render/collision systems
  - Level 1-2 features timing-based dodging challenge with swaying cacti
- October 17, 2025. Dash Mechanic Implementation:
  - Integrated existing dash system (Shift key) with invulnerability during dash
  - Added dash audio feedback using sped-up success sound (2x playback rate)
  - Created visual trail effect with green afterimages following dash direction
  - Added UI dash cooldown indicator (⚡ DASH ✓/⏳) with real-time updates
  - Player is invulnerable to both enemies and hazards while dashing
  - Final parameters: 100ms duration, ~60px distance, 18 px/frame speed (2.25x faster than running)
  - Dash cooldown: 800ms to prevent spam while maintaining skillful play
  - Dash respects level boundaries - cannot phase through walls
  - Updated Level 1-2 tutorial to explain dash mechanic
  - Fixed dash key detection in CommandInputSystem (ShiftLeft/ShiftRight)
- October 17, 2025. Level 1-3 "Fireball Fiesta" Addition:
  - Created new level 1.75 between Level 1-2 and Level 2
  - Implemented Fireball.ts class with homing projectile behavior
  - Created SpinningCactus.ts hazard that spins and shoots fireballs every 2 seconds
  - Fireballs home in on player position with 10% course correction per frame
  - Fireballs have visual trail effects (orange/red gradient with fading afterimages)
  - Updated LEVEL_SEQUENCE: 1 → 1.5 → 1.75 → 2 → 3 → 4 → 5
  - Dash mechanic essential for dodging homing fireballs (invulnerability works)
  - Level designed to teach skillful dash usage in combat situations
- October 17, 2025. Fireball Redirect Mechanic - Indirect Offense:
  - Implemented offensive mechanic through skillful movement and fireball redirection
  - Fireballs hit and destroy enemies in their path as they chase the player (1 fireball = 1 enemy killed)
  - Fireballs can damage the Spinning Cactus mini-boss (5 fireballs = cactus destroyed)
  - SpinningCactus has health system (5 HP) with visual health bar and color fading
  - Collision detection added for fireball-enemy and fireball-cactus interactions
  - Destroyed enemies are removed from level, destroyed cactus stops shooting
  - Fireballs damage anything in their path as they chase the player
  - If player dodges and something else is there (enemy or cactus), it gets hit
  - Fireball spawns outside cactus bounds to prevent immediate self-damage bug
  - Creates strategic gameplay: position yourself so fireballs hit enemies/cactus when you dodge
- October 30, 2025. Environment Cleanup & Storytelling Elements:
  - Removed all non-interactive decorations from Levels 1 and 2 (UFO wreckage pieces, cacti, buildings, debris)
  - Added crashed spacecraft wreckage in center of Level 1 as storytelling element
  - Spacecraft features retro 50s flying saucer design with gray/silver dome, yellow/orange band, cyan windows
  - Tilted crash position with scorch marks and burn damage to show impact
  - Animated smoke particles rising from crash site (drifting upward with fading opacity)
  - Non-interactive element serves as visual narrative showing Cosmo's origin/crash landing
- October 30, 2025. Level 2-2 "Sewer Streets" with Manhole Hazards:
  - Created Manhole.ts class with smooth opening/closing animations and timed cycles
  - Added Level 2.5 configuration between Level 2 and Level 3
  - Manholes open and close on configurable cycles (5 manholes with varying timings)
  - Players fall in and lose a life only when manhole is open
  - Collision detection integrated with damage system respecting open/closed state
  - Updated LEVEL_SEQUENCE: 1 → 1.5 → 1.75 → 2 → 2.5 → 3 → 4 → 5
  - Level uses same dystopian city backdrop/environment as Level 2
  - Cutscene added explaining manhole hazard mechanic and timing challenge
  - Teaches players to watch for environmental timing patterns
- October 31, 2025. Developer Testing Tools for Level Navigation:
  - Added jumpToLevel(targetLevel) method to GameEngine for instant level jumping
  - Created dev tools buttons in top-right corner of GameCanvas during gameplay
  - "⏭️ Next Level" button (orange) - instantly skips to next level in sequence
  - "🔄 Reset to L1" button (blue) - instantly returns to Level 1
  - Buttons only visible during active gameplay (isStarted === true)
  - Styled with hover effects and tooltips for clear identification as dev utilities
  - Enables rapid testing and debugging across all 8 levels
  - Dev tools respect level transition flow with proper initialization and cutscenes
- October 31, 2025. NYC Subway Manhole Visual Update:
  - Redesigned manhole covers with NYC subway aesthetic (circular design)
  - Added "NYC" text in center and "SUBWAY" text at bottom
  - Decorative symbols arranged around the edge (◯, ■, ◇, △, etc.)
  - Metallic blue-gray color scheme (#5A7D9A) with rust spots for realism
  - Changed animation from split-in-half to smooth slide-to-the-right motion
  - Orange glow effect appears around hole when opening (matches reference art)
  - Dark circular hole with depth shadows revealed underneath
  - Maintains existing collision detection and timing mechanics
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```