// lib/memoryPreloader.ts
import { Image } from "expo-image";

interface PreloadTask {
  url: string;
  priority: "high" | "normal" | "low";
  promise: Promise<void>;
}

class MemoryPreloader {
  private preloadedImages = new Set<string>();
  private activePreloads = new Map<string, PreloadTask>();
  private maxConcurrentPreloads = 3;
  private preloadQueue: { url: string; priority: "high" | "normal" | "low" }[] =
    [];

  // Optimalizované URL pre různé velikosti
  getOptimizedImageUrl(url: string, size: number = 800): string {
    if (!url) return "";

    // Cloudinary optimizations
    if (url.includes("cloudinary")) {
      const parts = url.split("/upload/");
      if (parts.length === 2) {
        return `${parts[0]}/upload/w_${size},f_auto,q_auto,c_limit/${parts[1]}`;
      }
    }

    // General URL optimizations
    if (url.includes("unsplash")) {
      return `${url}?w=${size}&q=80&fm=webp`;
    }

    return url;
  }

  // Preload single image
  async preloadImage(
    url: string,
    priority: "high" | "normal" | "low" = "normal"
  ): Promise<void> {
    if (!url || this.preloadedImages.has(url)) {
      return Promise.resolve();
    }

    // If already preloading, return existing promise
    if (this.activePreloads.has(url)) {
      return this.activePreloads.get(url)!.promise;
    }

    // If too many concurrent preloads, queue it
    if (this.activePreloads.size >= this.maxConcurrentPreloads) {
      this.preloadQueue.push({ url, priority });
      return Promise.resolve();
    }

    const promise = this.executePreload(url, priority);
    this.activePreloads.set(url, { url, priority, promise });

    return promise;
  }

  private async executePreload(
    url: string,
    priority: "high" | "normal" | "low"
  ): Promise<void> {
    try {
      await Image.prefetch(url, priority as any);
      this.preloadedImages.add(url);
      console.log(`📸 Preloaded: ${url.substring(0, 50)}...`);
    } catch (error) {
      console.warn(`❌ Preload failed: ${url}`, error);
    } finally {
      this.activePreloads.delete(url);
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (
      this.preloadQueue.length === 0 ||
      this.activePreloads.size >= this.maxConcurrentPreloads
    ) {
      return;
    }

    // Sort queue by priority
    this.preloadQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const next = this.preloadQueue.shift();
    if (next) {
      this.preloadImage(next.url, next.priority);
    }
  }

  // Preload multiple images for memory view
  async preloadMemoryRange(
    memories: any[],
    currentIndex: number,
    range: number = 2
  ): Promise<void> {
    const preloadPromises: Promise<void>[] = [];

    for (let i = -range; i <= range; i++) {
      const index = currentIndex + i;
      if (index >= 0 && index < memories.length) {
        const memory = memories[index];
        if (memory?.imageUrl) {
          // Different sizes for different distances
          const distance = Math.abs(i);
          let size = 800;
          let priority: "high" | "normal" | "low" = "normal";

          if (distance === 0) {
            size = 1200; // Current image - highest quality
            priority = "high";
          } else if (distance === 1) {
            size = 800; // Adjacent images
            priority = "high";
          } else {
            size = 600; // Further images
            priority = "low";
          }

          const optimizedUrl = this.getOptimizedImageUrl(memory.imageUrl, size);
          preloadPromises.push(this.preloadImage(optimizedUrl, priority));
        }
      }
    }

    await Promise.allSettled(preloadPromises);
  }

  // Clear old preloaded images to free memory
  clearOldImages(keepUrls: string[]): void {
    const keepSet = new Set(keepUrls);

    for (const url of this.preloadedImages) {
      if (!keepSet.has(url)) {
        this.preloadedImages.delete(url);
        // Note: expo-image handles cache cleanup internally
      }
    }
  }

  // Check if image is preloaded
  isPreloaded(url: string): boolean {
    return this.preloadedImages.has(url);
  }

  // Get preload status
  getPreloadStatus(): {
    preloaded: number;
    active: number;
    queued: number;
  } {
    return {
      preloaded: this.preloadedImages.size,
      active: this.activePreloads.size,
      queued: this.preloadQueue.length,
    };
  }

  // Cancel all preloads
  cancelAllPreloads(): void {
    this.preloadQueue.length = 0;
    this.activePreloads.clear();
  }
}

// Singleton instance
export const memoryPreloader = new MemoryPreloader();

// Hook for using preloader in components
export const useMemoryPreloader = () => {
  return {
    preloader: memoryPreloader,
    preloadMemoryRange:
      memoryPreloader.preloadMemoryRange.bind(memoryPreloader),
    getOptimizedImageUrl:
      memoryPreloader.getOptimizedImageUrl.bind(memoryPreloader),
    isPreloaded: memoryPreloader.isPreloaded.bind(memoryPreloader),
  };
};
