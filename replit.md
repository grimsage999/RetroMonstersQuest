# Cosmic Playground - Alien Cookie Quest Game

## Overview

"Cosmic Playground" is a 2D HTML5 Canvas game where players control a UFO to collect cookies and avoid enemies across multiple levels. The game features progressive difficulty, diverse enemy types, and themed environments. It's built with a React frontend, a TypeScript Express backend, and uses Drizzle ORM with PostgreSQL for data persistence. The project aims to deliver an engaging, visually appealing, and challenging retro-style gaming experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Styling**: Tailwind CSS for a custom design system.
- **Components**: Radix UI for consistent and accessible UI elements.
- **Game Aesthetics**: Pixel art style characters and environments with smooth animations.
- **Narrative**: Enhanced cutscenes and a story arc, including a victory epilogue.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Vite for tooling, Zustand for client-side state, React Query for server state.
- **Backend**: Express.js with TypeScript, Drizzle ORM for PostgreSQL.
- **Game Engine**: Object-oriented design with dedicated classes for game elements (Player, Enemy, Level, AudioManager, InputManager).
- **Game Loop**: Delta time calculations for smooth animations and consistent movement speed across different frame rates.
- **Collision Detection**: Spatial Grid optimization for efficient collision checks.
- **Audio System**: Web Audio API with an Audio Pool system for managing sound effects and background music.
- **Rendering**: HTML5 Canvas for 2D graphics, Sprite Batching for rendering optimization.
- **Input**: Keyboard input handling, with a dash mechanic (Shift key) providing temporary invulnerability.
- **State Management**: UIStateController to prevent overlapping UI elements and manage level transitions.
- **Deployment**: Configured for Replit with separate build processes for development and production, supporting hot module replacement and type checking.

### Feature Specifications
- **Player**: UFO character with movement, dash, and boundary checking.
- **Enemies**: Diverse enemy types (e.g., CIA agents, army men, radioactive rats) with AI behaviors, and mini-bosses (e.g., Spinning Cactus, Alligator).
- **Levels**: Multiple levels with distinct themes (e.g., sunset desert, cyberpunk city, dystopian subway), environmental hazards (e.g., Dancing Cactus, Manholes, Spinning Cactus, Fireballs), and a defined progression sequence.
- **Hazards**: Interactive environmental elements that pose threats or create strategic opportunities (e.g., Fireball redirection mechanic).
- **Scoring**: Collectible cookies as the primary objective.
- **Developer Tools**: In-game buttons for instant level jumping and resetting to Level 1 for rapid testing.

## External Dependencies

- **Frontend Framework**: React
- **Build Tool**: Vite
- **Styling Framework**: Tailwind CSS
- **UI Components**: Radix UI
- **Client State Management**: Zustand
- **Server State Management**: React Query
- **Backend Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (via Neon serverless)
- **Game Rendering**: HTML5 Canvas API
- **Audio**: Web Audio API
- **TypeScript**: For both client and server-side development

## Recent Changes

```
- October 31, 2025. Level 2.75 "Grease Gator" with Alligator Mini-Boss - Enhanced:
  - Created Alligator.ts class - menacing mini-boss that hunts from manholes
  - Added Level 2.75 configuration between Level 2.5 and Level 3
  - Updated LEVEL_SEQUENCE: 1 → 1.5 → 1.75 → 2 → 2.5 → 2.75 → 3 → 4 → 5
  - Alligator emerges from any manhole (5 spawn points) with humanoid design
  - Attack patterns: Bite and grab attacks with extending neck animation
  - **Neck Extension**: Animated neck extends ~35 pixels upward during attacks using sine wave motion
  - Segmented neck rendering (4 segments) with green scales and beige underbelly
  - **Increased Attack Frequency**: 
    - High cookies (>70%): 4-5 seconds between attacks
    - Medium cookies (30-70%): 3-4 seconds between attacks
    - Low cookies (<30%): 2-3 seconds between attacks
  - ONE-HIT KILL mechanic - instant death if caught (dash provides invulnerability)
  - **Audio system**: Menacing laughter as audio cue during warning phase before attacks
    - Sinister intro laugh (0.4x playback rate)
    - Ambient laughs at 10-20 second intervals (0.5x playback rate)
    - Attack warning laughs (0.6x playback rate)
  - Visual telegraph: Manhole shake/rattle + orange glow before each attack (1.5s warning)
  - Dynamic difficulty: Attack frequency scales with cookie count
  - Collision detection follows animated head position for accurate hit detection
  - Introduction sequence: 2.5 second dramatic pause with sinister laugh before attacks begin
  - Level uses same dystopian city backdrop/environment as Level 2/2.5
```