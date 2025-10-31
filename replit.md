# Cosmic Playground - Alien Cookie Quest Game

## Overview
"Cosmic Playground" is a 2D HTML5 Canvas game where players control a UFO to collect cookies and avoid enemies across multiple levels. Built with React, a TypeScript Express backend, and Drizzle ORM with PostgreSQL, the game offers an engaging, visually appealing, and challenging retro-style gaming experience with progressive difficulty, diverse enemy types, and themed environments. The project aims to provide a rich narrative through enhanced cutscenes and a comprehensive story arc.

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
- **Game Engine**: Object-oriented design with classes for game elements (Player, Enemy, Level, AudioManager, InputManager). Features include delta time calculations for smooth animations, Spatial Grid optimization for efficient collision detection, Web Audio API with an Audio Pool for sound management, and Sprite Batching for rendering.
- **Rendering**: HTML5 Canvas for 2D graphics.
- **Input**: Keyboard input handling, including a dash mechanic for temporary invulnerability.
- **State Management**: UIStateController for managing UI elements and level transitions.
- **Deployment**: Configured for Replit with separate build processes for development and production, supporting hot module replacement and type checking.
- **Logging**: Structured logging system with environment-based log level filtering (Logger.ts).

### Feature Specifications
- **Player**: UFO character with movement, dash, and boundary checking.
- **Enemies**: Diverse enemy types (e.g., CIA agents, army men, radioactive rats), mini-bosses (e.g., Alligator, Necromancer), and a final boss (Void Lord) with unique AI behaviors and attack patterns.
- **Levels**: Multiple levels with distinct themes (e.g., sunset desert, cyberpunk city, dystopian subway, graveyard, government lab, cosmic void), environmental hazards (e.g., Dancing Cactus, Manholes, Spinning Cactus, Fireballs), and a defined progression sequence.
- **Hazards**: Interactive environmental elements posing threats or strategic opportunities (e.g., Fireball redirection).
- **Collectibles**: Cookies as the primary objective.
- **Power-Ups**: "Weapon X" (Bubble Shield) provides temporary enemy repulsion and paralysis.
- **Developer Tools**: In-game buttons for instant level jumping and resetting for rapid testing.

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
- **Language**: TypeScript (for both client and server-side)