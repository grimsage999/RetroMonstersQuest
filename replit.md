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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```