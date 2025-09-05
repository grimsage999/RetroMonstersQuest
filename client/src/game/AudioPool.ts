/**
 * Audio Pool Manager for efficient sound effect playback
 * Reuses audio instances instead of creating new ones
 */
export class AudioPool {
  private pools: Map<string, HTMLAudioElement[]>;
  private poolSize: number;
  private volume: number;

  constructor(poolSize: number = 5) {
    this.pools = new Map();
    this.poolSize = poolSize;
    this.volume = 0.3;
  }

  /**
   * Initialize a pool for a specific sound
   */
  initializeSound(name: string, src: string, poolSize?: number): void {
    const size = poolSize || this.poolSize;
    const pool: HTMLAudioElement[] = [];

    for (let i = 0; i < size; i++) {
      const audio = new Audio(src);
      audio.volume = this.volume;
      audio.preload = 'auto';
      pool.push(audio);
    }

    this.pools.set(name, pool);
  }

  /**
   * Play a sound from the pool
   */
  play(name: string): void {
    const pool = this.pools.get(name);
    if (!pool) {
      // Sound not found in audio pool
      return;
    }

    // Find an available audio instance
    for (const audio of pool) {
      if (audio.paused || audio.ended) {
        audio.currentTime = 0;
        audio.play().catch(e => {
          // Silently handle autoplay restrictions
          if (e.name !== 'NotAllowedError') {
            // Error playing sound - handled silently
          }
        });
        return;
      }
    }

    // All instances are busy, clone and play the first one
    // This is a fallback for high-frequency sounds
    const audio = pool[0].cloneNode() as HTMLAudioElement;
    audio.volume = this.volume;
    audio.play().catch(e => {
      if (e.name !== 'NotAllowedError') {
        // Error playing cloned sound - handled silently
      }
    });
  }

  /**
   * Set volume for all sounds
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    this.pools.forEach(pool => {
      pool.forEach(audio => {
        audio.volume = this.volume;
      });
    });
  }

  /**
   * Stop all sounds of a specific type
   */
  stopAll(name?: string): void {
    if (name) {
      const pool = this.pools.get(name);
      if (pool) {
        pool.forEach(audio => {
          audio.pause();
          audio.currentTime = 0;
        });
      }
    } else {
      // Stop all sounds
      this.pools.forEach(pool => {
        pool.forEach(audio => {
          audio.pause();
          audio.currentTime = 0;
        });
      });
    }
  }

  /**
   * Preload all sounds in the pools
   */
  async preloadAll(): Promise<void> {
    const promises: Promise<void>[] = [];

    this.pools.forEach(pool => {
      pool.forEach(audio => {
        promises.push(new Promise((resolve) => {
          if (audio.readyState >= 3) {
            resolve();
          } else {
            audio.addEventListener('canplaythrough', () => resolve(), { once: true });
            audio.load();
          }
        }));
      });
    });

    await Promise.all(promises);
  }

  /**
   * Get pool statistics for debugging
   */
  getStats(): { totalPools: number; totalInstances: number; busyInstances: number } {
    let totalInstances = 0;
    let busyInstances = 0;

    this.pools.forEach(pool => {
      totalInstances += pool.length;
      pool.forEach(audio => {
        if (!audio.paused && !audio.ended) {
          busyInstances++;
        }
      });
    });

    return {
      totalPools: this.pools.size,
      totalInstances,
      busyInstances
    };
  }
}