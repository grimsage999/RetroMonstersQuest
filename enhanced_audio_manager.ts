/**
 * ENHANCED AUDIO MANAGER WITH ERROR HANDLING
 * Implements robust audio management with graceful fallbacks
 */

import { logger } from './Logger';
import { GAME_CONFIG } from './GameConfig';

export enum AudioType {
  BACKGROUND = 'background',
  HIT = 'hit',
  SUCCESS = 'success',
  DASH = 'dash',
  VICTORY = 'victory',
  GAME_START = 'game_start',
  CRUNCH = 'crunch',
  RAY_GUN = 'ray_gun',
  ADJUDICATOR = 'adjudicator'
}

export interface AudioAssetConfig {
  path: string;
  volume: number;
  loop?: boolean;
}

export class EnhancedAudioManager {
  private audioContext: AudioContext | null = null;
  private isInitialized: boolean = false;
  private isMuted: boolean = false;
  private isAudioAvailable: boolean = true; // Assume audio is available until proven otherwise
  
  // Audio elements with proper typing
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private fallbackAudioElements: Map<string, HTMLAudioElement> = new Map();
  
  // Configuration
  private readonly audioConfigs: Record<AudioType, AudioAssetConfig> = {
    [AudioType.BACKGROUND]: {
      path: '/sounds/background.mp3',
      volume: GAME_CONFIG.AUDIO.BACKGROUND_MUSIC_VOLUME,
      loop: true
    },
    [AudioType.HIT]: {
      path: '/sounds/hit.mp3',
      volume: GAME_CONFIG.AUDIO.HIT_SOUND_VOLUME
    },
    [AudioType.SUCCESS]: {
      path: '/sounds/success.mp3',
      volume: GAME_CONFIG.AUDIO.SUCCESS_SOUND_VOLUME
    },
    [AudioType.DASH]: {
      path: '/sounds/success.mp3', // Use success sound as fallback
      volume: 0.3
    },
    [AudioType.VICTORY]: {
      path: '/sounds/success.mp3', // Use success sound as fallback
      volume: 0.8
    },
    [AudioType.GAME_START]: {
      path: '/sounds/success.mp3', // Use success sound as fallback
      volume: 0.5
    },
    [AudioType.CRUNCH]: {
      path: '/sounds/hit.mp3', // Use hit sound as fallback
      volume: 0.4
    },
    [AudioType.RAY_GUN]: {
      path: '/sounds/hit.mp3', // Use hit sound as fallback
      volume: 0.3
    },
    [AudioType.ADJUDICATOR]: {
      path: '/sounds/success.mp3', // Use success sound as fallback
      volume: 0.6
    }
  };
  
  // Loading status for each audio type
  private audioLoadStatus: Map<AudioType, { loaded: boolean; error?: string }> = new Map();
  
  // Retry settings
  private readonly maxLoadRetries: number = 3;
  private loadRetryCount: Map<AudioType, number> = new Map();

  constructor() {
    this.initializeLoadStatus();
  }

  /**
   * Initialize the audio manager with error handling
   */
  public async initialize(): Promise<boolean> {
    try {
      // Check if Web Audio API is supported
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        logger.warn('Web Audio API not supported, audio disabled');
        this.isAudioAvailable = false;
        return false;
      }
      
      // Create audio context on user interaction
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume AudioContext to unlock audio playback
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      } catch (contextError) {
        logger.warn('Failed to create audio context, audio disabled:', contextError);
        this.isAudioAvailable = false;
        return false;
      }
      
      // Load all audio assets with fallback handling
      await this.loadAllAudioAssets();
      
      this.isInitialized = true;
      logger.info('Audio manager initialized successfully');
      return true;
      
    } catch (error) {
      logger.error('Failed to initialize audio manager:', error);
      this.isAudioAvailable = false;
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Initialize loading status for all audio types
   */
  private initializeLoadStatus(): void {
    Object.values(AudioType).forEach(audioType => {
      if (typeof audioType === 'string') {
        this.audioLoadStatus.set(audioType as AudioType, { loaded: false });
        this.loadRetryCount.set(audioType as AudioType, 0);
      }
    });
  }

  /**
   * Load all audio assets with retry and fallback mechanism
   */
  private async loadAllAudioAssets(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [audioType, config] of Object.entries(this.audioConfigs)) {
      const type = audioType as AudioType;
      promises.push(this.loadAudioAsset(type, config));
    }
    
    try {
      await Promise.all(promises);
      logger.info('All audio assets loaded (with possible fallbacks)');
    } catch (error) {
      logger.error('Error loading audio assets:', error);
    }
  }

  /**
   * Load a specific audio asset with retry and fallback mechanism
   */
  private async loadAudioAsset(type: AudioType, config: AudioAssetConfig): Promise<void> {
    try {
      // Try loading the primary asset first
      const audioElement = await this.loadAudioWithRetry(type, config.path);
      
      if (audioElement) {
        // Apply configuration
        audioElement.volume = config.volume;
        audioElement.loop = !!config.loop;
        
        this.audioElements.set(type, audioElement);
        this.audioLoadStatus.set(type, { loaded: true });
        logger.debug(`Audio asset loaded: ${type} from ${config.path}`);
      } else {
        // Mark as failed but will use fallback
        this.audioLoadStatus.set(type, { loaded: false, error: 'Failed to load primary asset' });
        logger.warn(`Failed to load primary audio asset: ${type}, will use fallback`);
      }
    } catch (error) {
      logger.error(`Failed to load audio asset ${type}:`, error);
      this.audioLoadStatus.set(type, { loaded: false, error: (error as Error).message });
      
      // Mark as failed but will use fallback
    }
  }

  /**
   * Load audio with retry mechanism
   */
  private async loadAudioWithRetry(type: AudioType, path: string, attempt: number = 1): Promise<HTMLAudioElement | null> {
    try {
      const audio = new Audio(path);
      audio.preload = 'auto';
      
      return new Promise<HTMLAudioElement | null>((resolve) => {
        const loadTimeout = setTimeout(() => {
          logger.warn(`Audio load timeout for ${path} (attempt ${attempt})`);
          resolve(null);
        }, 5000); // 5 second timeout
        
        audio.addEventListener('canplaythrough', () => {
          clearTimeout(loadTimeout);
          resolve(audio);
        }, { once: true });
        
        audio.addEventListener('error', (error) => {
          clearTimeout(loadTimeout);
          logger.warn(`Audio load error for ${path} (attempt ${attempt}):`, error);
          
          // Try fallback if we haven't exhausted retries
          const retryCount = this.loadRetryCount.get(type) || 0;
          if (attempt < this.maxLoadRetries) {
            this.loadRetryCount.set(type, retryCount + 1);
            logger.info(`Retrying audio load for ${type}, attempt ${attempt + 1}`);
            setTimeout(() => {
              this.loadAudioWithRetry(type, path, attempt + 1)
                .then(resolve)
                .catch(() => resolve(null));
            }, 1000 * attempt); // Exponential backoff
          } else {
            resolve(null);
          }
        }, { once: true });
        
        audio.addEventListener('loadstart', () => {
          logger.debug(`Audio load started for ${path}`);
        });
        
        audio.load();
      });
    } catch (error) {
      logger.error(`Error creating audio element for ${path}:`, error);
      return null;
    }
  }

  /**
   * Play an audio asset with fallback and error handling
   */
  public playAudio(type: AudioType, playbackOptions?: { volume?: number; rate?: number; loop?: boolean }): boolean {
    if (!this.isAudioAvailable || this.isMuted || !this.isInitialized) {
      return false;
    }
    
    try {
      // Check if the primary audio is loaded
      const primaryAudio = this.audioElements.get(type);
      const loadStatus = this.audioLoadStatus.get(type);
      
      if (loadStatus?.loaded && primaryAudio) {
        // Use primary audio
        return this.playAudioElement(primaryAudio, playbackOptions);
      } else {
        // Use fallback audio (try to clone from a related type)
        return this.playWithFallback(type, playbackOptions);
      }
    } catch (error) {
      logger.error(`Error playing audio ${type}:`, error);
      return false;
    }
  }

  /**
   * Play an audio element with options
   */
  private playAudioElement(audio: HTMLAudioElement, options?: { volume?: number; rate?: number; loop?: boolean }): boolean {
    try {
      // Clone the audio element to allow overlapping playback
      const audioClone = audio.cloneNode(true) as HTMLAudioElement;
      
      // Apply options
      if (options?.volume !== undefined) {
        audioClone.volume = options.volume;
      }
      if (options?.rate !== undefined) {
        audioClone.playbackRate = options.rate;
      }
      if (options?.loop !== undefined) {
        audioClone.loop = options.loop;
      }
      
      // Play the audio
      const playPromise = audioClone.play();
      if (playPromise) {
        playPromise.catch(error => {
          logger.info(`Audio playback prevented for ${audio.src}:`, error);
          // Don't fail the game if audio playback is prevented
        });
      }
      return true;
    } catch (error) {
      logger.error(`Error playing audio element:`, error);
      return false;
    }
  }

  /**
   * Play audio with fallback mechanism
   */
  private playWithFallback(type: AudioType, options?: { volume?: number; rate?: number; loop?: boolean }): boolean {
    // Define fallback mappings
    const fallbackMap: Partial<Record<AudioType, AudioType>> = {
      [AudioType.DASH]: AudioType.SUCCESS,
      [AudioType.VICTORY]: AudioType.SUCCESS,
      [AudioType.GAME_START]: AudioType.SUCCESS,
      [AudioType.CRUNCH]: AudioType.HIT,
      [AudioType.RAY_GUN]: AudioType.HIT,
      [AudioType.ADJUDICATOR]: AudioType.SUCCESS
    };
    
    // Try fallback audio
    const fallbackType = fallbackMap[type];
    if (fallbackType) {
      const fallbackAudio = this.audioElements.get(fallbackType);
      if (fallbackAudio) {
        logger.debug(`Using fallback audio for ${type} from ${fallbackType}`);
        return this.playAudioElement(fallbackAudio, options);
      }
    }
    
    // If no fallback is available, try the base success/hit sounds
    const baseFallback = type.includes('SUCCESS') || type.includes('VICTORY') || type.includes('GAME_START') || type.includes('ADJUDICATOR') 
      ? this.audioElements.get(AudioType.SUCCESS) 
      : this.audioElements.get(AudioType.HIT);
    
    if (baseFallback) {
      logger.debug(`Using base fallback audio for ${type}`);
      return this.playAudioElement(baseFallback, options);
    }
    
    logger.warn(`No audio or fallback available for ${type}`);
    return false;
  }

  // Specific audio playing methods
  public playBackgroundMusic(): boolean {
    return this.playAudio(AudioType.BACKGROUND, { loop: true });
  }

  public stopBackgroundMusic(): void {
    const backgroundAudio = this.audioElements.get(AudioType.BACKGROUND);
    if (backgroundAudio) {
      backgroundAudio.pause();
      backgroundAudio.currentTime = 0;
    }
  }

  public playHit(): boolean {
    return this.playAudio(AudioType.HIT, { volume: GAME_CONFIG.AUDIO.HIT_SOUND_VOLUME });
  }

  public playSuccess(): boolean {
    return this.playAudio(AudioType.SUCCESS, { volume: GAME_CONFIG.AUDIO.SUCCESS_SOUND_VOLUME });
  }

  public playDash(): boolean {
    return this.playAudio(AudioType.DASH, { volume: 0.3, rate: 2.0 });
  }

  public playVictoryFanfare(): boolean {
    return this.playAudio(AudioType.VICTORY, { volume: 0.8, rate: 1.2 });
  }

  public playGameStart(): boolean {
    return this.playAudio(AudioType.GAME_START, { volume: 0.5, rate: 1.5 });
  }

  public playCrunch(): boolean {
    return this.playAudio(AudioType.CRUNCH, { volume: 0.4, rate: 1.5 });
  }

  public playRayGun(): boolean {
    return this.playAudio(AudioType.RAY_GUN, { volume: 0.3, rate: 0.8 });
  }

  public playAdjudicator(): boolean {
    return this.playAudio(AudioType.ADJUDICATOR, { volume: 0.6, rate: 0.7 });
  }

  /**
   * Toggle mute state
   */
  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.stopBackgroundMusic();
    } else {
      // Background music will resume on next play request
    }
    
    logger.info(`Audio ${this.isMuted ? 'muted' : 'unmuted'}`);
  }

  /**
   * Check if audio is initialized and available
   */
  public isAvailable(): boolean {
    return this.isAudioAvailable && this.isInitialized;
  }

  /**
   * Get initialization status
   */
  public getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * Get audio load status for a specific type
   */
  public getAudioLoadStatus(type: AudioType): { loaded: boolean; error?: string } {
    return this.audioLoadStatus.get(type) || { loaded: false, error: 'Audio type not found' };
  }

  /**
   * Get overall audio health (how many assets loaded successfully)
   */
  public getAudioHealth(): { total: number; loaded: number; failed: number } {
    const entries = Array.from(this.audioLoadStatus.entries());
    return {
      total: entries.length,
      loaded: entries.filter(([_, status]) => status.loaded).length,
      failed: entries.filter(([_, status]) => !status.loaded).length
    };
  }

  /**
   * Clean up all audio resources
   */
  public destroy(): void {
    // Pause and clear all audio elements
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.src = '';
      audio.load();
    });
    
    this.fallbackAudioElements.forEach(audio => {
      audio.pause();
      audio.src = '';
      audio.load();
    });
    
    this.audioElements.clear();
    this.fallbackAudioElements.clear();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isInitialized = false;
    logger.info('Audio manager destroyed');
  }
}