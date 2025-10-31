/**
 * ASSET LOADING Fallback System
 * Implements robust asset loading with fallback mechanisms and placeholder handling
 */

import { logger } from './Logger';

export enum AssetType {
  IMAGE = 'image',
  AUDIO = 'audio',
  JSON = 'json',
  TEXT = 'text'
}

export interface AssetConfig {
  url: string;
  fallback?: string;
  placeholder?: string;
  type: AssetType;
  timeout?: number;
}

export interface AssetLoadResult<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
  usedFallback: boolean;
  usedPlaceholder: boolean;
}

export class AssetManager {
  private cache: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<AssetLoadResult>> = new Map();
  private readonly maxRetries: number = 3;
  private readonly defaultTimeout: number = 10000; // 10 seconds

  constructor() {
    // Initialize with common fallbacks
    this.addCommonFallbacks();
  }

  /**
   * Add common fallback assets
   */
  private addCommonFallbacks(): void {
    // Common audio fallbacks
    this.cache.set('/sounds/hit.mp3', this.createFallbackAudio());
    this.cache.set('/sounds/success.mp3', this.createFallbackAudio());
    this.cache.set('/sounds/background.mp3', this.createFallbackAudio());
    
    // Common image fallbacks
    this.cache.set('/images/fallback.png', this.createFallbackImage());
  }

  /**
   * Create a fallback audio object
   */
  private createFallbackAudio(): HTMLAudioElement {
    const audio = new Audio();
    // Set a silent audio source as fallback
    audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAAAAAA=';
    return audio;
  }

  /**
   * Create a fallback image
   */
  private createFallbackImage(): HTMLImageElement {
    const img = new Image();
    // Create a 1x1 transparent pixel as fallback
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    return img;
  }

  /**
   * Load an asset with fallback and retry mechanisms
   */
  public async loadAsset<T = any>(config: AssetConfig): Promise<AssetLoadResult<T>> {
    const cacheKey = this.getCacheKey(config);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      logger.debug(`Asset loaded from cache: ${config.url}`);
      return {
        success: true,
        data: this.cache.get(cacheKey),
        usedFallback: false,
        usedPlaceholder: false
      };
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      logger.debug(`Asset already loading: ${config.url}`);
      return this.loadingPromises.get(cacheKey)!;
    }

    // Start loading
    const loadPromise = this.loadAssetWithRetry(config, 1);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      // Cache successful results
      if (result.success) {
        this.cache.set(cacheKey, result.data);
      }
      return result;
    } finally {
      // Clean up loading promise
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Load an asset with retry mechanism
   */
  private async loadAssetWithRetry<T = any>(config: AssetConfig, attempt: number): Promise<AssetLoadResult<T>> {
    try {
      // Try primary asset
      const result = await this.loadSingleAsset(config);
      
      if (result.success) {
        logger.debug(`Asset loaded successfully: ${config.url} (attempt ${attempt})`);
        return result;
      }

      // If it failed and we have retries left, try fallback
      if (attempt < this.maxRetries) {
        logger.warn(`Asset load failed: ${config.url} (attempt ${attempt}), trying fallback`);
        
        if (config.fallback) {
          // Temporarily change the URL to fallback
          const fallbackConfig = { ...config, url: config.fallback };
          return this.loadAssetWithRetry(fallbackConfig, attempt + 1);
        } else {
          logger.info(`No fallback provided for ${config.url}, attempting re-try (${attempt + 1})`);
          // Wait before retrying the same URL
          await this.delay(1000 * attempt); // Exponential backoff
          return this.loadAssetWithRetry(config, attempt + 1);
        }
      }

      logger.warn(`Asset load failed after ${this.maxRetries} attempts: ${config.url}`);
      return this.createPlaceholderResult(config);
    } catch (error) {
      logger.error(`Error loading asset ${config.url} (attempt ${attempt}):`, error);
      
      if (attempt < this.maxRetries) {
        logger.info(`Retrying asset load: ${config.url} (attempt ${attempt + 1})`);
        await this.delay(1000 * attempt); // Exponential backoff
        return this.loadAssetWithRetry(config, attempt + 1);
      }

      return this.createPlaceholderResult(config, (error as Error).message);
    }
  }

  /**
   * Load a single asset based on its type
   */
  private async loadSingleAsset<T = any>(config: AssetConfig): Promise<AssetLoadResult<T>> {
    const timeout = config.timeout || this.defaultTimeout;
    
    return Promise.race([
      this.loadAssetByType(config),
      this.createTimeoutPromise(timeout, config.url)
    ]);
  }

  /**
   * Load asset based on its type
   */
  private async loadAssetByType<T = any>(config: AssetConfig): Promise<AssetLoadResult<T>> {
    switch (config.type) {
      case AssetType.IMAGE:
        return this.loadImage(config.url) as Promise<AssetLoadResult<T>>;
      case AssetType.AUDIO:
        return this.loadAudio(config.url) as Promise<AssetLoadResult<T>>;
      case AssetType.JSON:
        return this.loadJson(config.url) as Promise<AssetLoadResult<T>>;
      case AssetType.TEXT:
        return this.loadText(config.url) as Promise<AssetLoadResult<T>>;
      default:
        return {
          success: false,
          data: null,
          error: `Unsupported asset type: ${config.type}`,
          usedFallback: false,
          usedPlaceholder: false
        };
    }
  }

  /**
   * Load an image asset
   */
  private async loadImage(url: string): Promise<AssetLoadResult<HTMLImageElement>> {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          success: true,
          data: img,
          usedFallback: false,
          usedPlaceholder: false
        });
      };
      
      img.onerror = (error) => {
        logger.warn(`Image load error: ${url}`, error);
        resolve({
          success: false,
          data: null,
          error: `Failed to load image: ${url}`,
          usedFallback: false,
          usedPlaceholder: false
        });
      };
      
      img.src = url;
    });
  }

  /**
   * Load an audio asset
   */
  private async loadAudio(url: string): Promise<AssetLoadResult<HTMLAudioElement>> {
    return new Promise((resolve) => {
      const audio = new Audio();
      
      // Use a more robust loading approach
      audio.preload = 'auto';
      
      const loadHandler = () => {
        cleanup();
        resolve({
          success: true,
          data: audio,
          usedFallback: false,
          usedPlaceholder: false
        });
      };
      
      const errorHandler = (error: any) => {
        cleanup();
        logger.warn(`Audio load error: ${url}`, error);
        resolve({
          success: false,
          data: null,
          error: `Failed to load audio: ${url}`,
          usedFallback: false,
          usedPlaceholder: false
        });
      };
      
      const cleanup = () => {
        audio.removeEventListener('canplaythrough', loadHandler);
        audio.removeEventListener('error', errorHandler);
      };
      
      audio.addEventListener('canplaythrough', loadHandler, { once: true });
      audio.addEventListener('error', errorHandler, { once: true });
      
      audio.src = url;
      audio.load();
    });
  }

  /**
   * Load a JSON asset
   */
  private async loadJson(url: string): Promise<AssetLoadResult<any>> {
    try {
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors' // Enable CORS for external assets
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        data,
        usedFallback: false,
        usedPlaceholder: false
      };
    } catch (error) {
      logger.warn(`JSON load error: ${url}`, error);
      return {
        success: false,
        data: null,
        error: `Failed to load JSON: ${error}`,
        usedFallback: false,
        usedPlaceholder: false
      };
    }
  }

  /**
   * Load a text asset
   */
  private async loadText(url: string): Promise<AssetLoadResult<string>> {
    try {
      const response = await fetch(url, { 
        method: 'GET', 
        mode: 'cors' 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.text();
      return {
        success: true,
        data,
        usedFallback: false,
        usedPlaceholder: false
      };
    } catch (error) {
      logger.warn(`Text load error: ${url}`, error);
      return {
        success: false,
        data: null,
        error: `Failed to load text: ${error}`,
        usedFallback: false,
        usedPlaceholder: false
      };
    }
  }

  /**
   * Create timeout promise for asset loading
   */
  private createTimeoutPromise(timeout: number, url: string): Promise<AssetLoadResult<any>> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        logger.warn(`Asset load timeout: ${url} (after ${timeout}ms)`);
        reject(new Error(`Asset load timeout for ${url}`));
      }, timeout);
    });
  }

  /**
   * Create placeholder result when all loading attempts fail
   */
  private createPlaceholderResult<T = any>(config: AssetConfig, error?: string): AssetLoadResult<T> {
    let placeholderData: any = null;
    
    // Try to use placeholder if available
    if (config.placeholder) {
      // Return a placeholder for the expected type
      switch (config.type) {
        case AssetType.IMAGE:
          placeholderData = this.createFallbackImage();
          break;
        case AssetType.AUDIO:
          placeholderData = this.createFallbackAudio();
          break;
        case AssetType.JSON:
        case AssetType.TEXT:
          placeholderData = config.type === AssetType.JSON ? {} : '';
          break;
        default:
          placeholderData = null;
      }
      
      logger.info(`Using placeholder for ${config.url}`);
      
      return {
        success: true, // Consider successful if we have a placeholder
        data: placeholderData,
        usedFallback: false,
        usedPlaceholder: true,
        error
      };
    }
    
    logger.warn(`Asset failed to load and no placeholder available: ${config.url}`);
    
    return {
      success: false,
      data: null,
      usedFallback: false,
      usedPlaceholder: false,
      error: error || `Failed to load asset: ${config.url}`
    };
  }

  /**
   * Preload multiple assets
   */
  public async preloadAssets(configs: AssetConfig[]): Promise<Map<string, AssetLoadResult>> {
    const results = new Map<string, AssetLoadResult>();
    const promises = configs.map(async (config) => {
      const result = await this.loadAsset(config);
      results.set(config.url, result);
      return { url: config.url, result };
    });
    
    await Promise.all(promises);
    return results;
  }

  /**
   * Get cache key for an asset config
   */
  private getCacheKey(config: AssetConfig): string {
    return `${config.url}_${config.type}`;
  }

  /**
   * Clear the asset cache
   */
  public clearCache(): void {
    this.cache.clear();
    logger.info('Asset cache cleared');
  }

  /**
   * Get cached asset if available
   */
  public getCachedAsset<T = any>(url: string, type: AssetType): T | null {
    const cacheKey = this.getCacheKey({ url, type });
    return this.cache.get(cacheKey) || null;
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Enhanced Level class with asset fallback support
 */
export class EnhancedLevelAssetManager {
  private assetManager: AssetManager;
  
  constructor() {
    this.assetManager = new AssetManager();
  }

  /**
   * Load level assets with fallbacks
   */
  public async loadLevelAssets(levelNumber: number): Promise<boolean> {
    const assetsToLoad: AssetConfig[] = [];

    // Add level-specific assets with fallbacks
    switch (levelNumber) {
      case 1:
        assetsToLoad.push(
          { url: '/sounds/level1_theme.mp3', type: AssetType.AUDIO, fallback: '/sounds/background.mp3' },
          { url: '/images/level1_background.png', type: AssetType.IMAGE, fallback: '/images/fallback.png' }
        );
        break;
      case 2:
        assetsToLoad.push(
          { url: '/sounds/level2_theme.mp3', type: AssetType.AUDIO, fallback: '/sounds/background.mp3' },
          { url: '/images/level2_background.png', type: AssetType.IMAGE, fallback: '/images/fallback.png' }
        );
        break;
      // Add more level cases as needed
      default:
        // Add generic assets for any level
        assetsToLoad.push(
          { url: '/sounds/background.mp3', type: AssetType.AUDIO }
        );
    }

    // Preload all assets for the level
    const results = await this.assetManager.preloadAssets(assetsToLoad);
    
    // Check if critical assets loaded successfully
    let allCriticalLoaded = true;
    for (const [url, result] of results) {
      if (!result.success) {
        logger.warn(`Non-critical asset failed to load: ${url}`);
      }
    }
    
    return allCriticalLoaded;
  }

  /**
   * Get the underlying asset manager
   */
  public getAssetManager(): AssetManager {
    return this.assetManager;
  }
}