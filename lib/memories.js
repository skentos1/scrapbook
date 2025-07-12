import { Query } from "appwrite";
import { COLLECTIONS, DATABASE_ID, databases, ID } from "./appwrite";

const CLOUDINARY_CLOUD_NAME = "drvop2yuc";
const CLOUDINARY_UPLOAD_PRESET = "scrapbook_unsigned";
const CLOUDINARY_FOLDER = "scrapbook";

// Cache pre obrázky
const imageUrlCache = new Map();

export const memoriesService = {
  // Optimalizácia URL pre Cloudinary
  getOptimizedImageUrl(url, options = {}) {
    if (!url) return null;

    const { width = 800, quality = "auto", format = "auto" } = options;
    const cacheKey = `${url}_${width}_${quality}_${format}`;

    // Kontrola cache
    if (imageUrlCache.has(cacheKey)) {
      return imageUrlCache.get(cacheKey);
    }

    let optimizedUrl = url;

    if (url.includes("cloudinary.com")) {
      const parts = url.split("/upload/");
      if (parts.length === 2) {
        const transformations = [
          `w_${width}`,
          `q_${quality}`,
          `f_${format}`,
          "dpr_auto",
          "c_limit",
          "fl_progressive",
        ].join(",");

        optimizedUrl = `${parts[0]}/upload/${transformations}/${parts[1]}`;
      }
    }

    // Uložiť do cache
    imageUrlCache.set(cacheKey, optimizedUrl);
    return optimizedUrl;
  },

  // Vytvorenie novej spomienky s optimalizáciou
  async createMemory(scrapbookId, memoryData, imageFile) {
    try {
      let imageUrl = null;
      let imageId = null;

      if (imageFile) {
        const uploadResponse = await this.uploadMemoryImage(imageFile);
        imageUrl = uploadResponse.imageUrl;
        imageId = uploadResponse.imageId;
      }

      const memory = {
        scrapbookId,
        title: memoryData.title,
        description: memoryData.description || "",
        imageUrl,
        imageId,
        date: memoryData.date || new Date().toISOString(),
        location: memoryData.location || null,
        latitude: memoryData.latitude || null,
        longitude: memoryData.longitude || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const createdMemory = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MEMORIES,
        ID.unique(),
        memory
      );

      await this.updateScrapbookMemoryCount(scrapbookId);

      // Vrátiť s optimalizovanými URL
      return {
        ...createdMemory,
        imageUrl: this.getOptimizedImageUrl(createdMemory.imageUrl),
        thumbnailUrl: this.getOptimizedImageUrl(createdMemory.imageUrl, {
          width: 400,
        }),
      };
    } catch (error) {
      console.error("Create memory error:", error);
      throw error;
    }
  },

  // Upload obrázka spomienky na Cloudinary
  async uploadMemoryImage(imageFile) {
    try {
      const formData = new FormData();

      // Pre React Native
      const file = {
        uri: imageFile.uri,
        type: imageFile.type || "image/jpeg",
        name: imageFile.fileName || `memory_${Date.now()}.jpg`,
      };

      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", CLOUDINARY_FOLDER);
      formData.append("resource_type", "image");

      // Pridať transformácie pre automatickú optimalizáciu
      // formData.append("eager", "w_1200,q_auto,f_auto|w_400,q_auto,f_auto");
      // formData.append("eager_async", "true");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Upload failed");
      }

      const data = await response.json();

      return {
        imageUrl: data.secure_url,
        imageId: data.public_id,
        thumbnailUrl:
          data.eager?.[1]?.secure_url ||
          this.getOptimizedImageUrl(data.secure_url, { width: 400 }),
      };
    } catch (error) {
      console.error("Upload to Cloudinary error:", error);
      throw new Error(
        "Nepodarilo sa nahrať obrázok. Skontrolujte nastavenia Cloudinary."
      );
    }
  },

  // Získanie spomienok s optimalizovanými URL
  async getScrapbookMemories(scrapbookId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MEMORIES,
        [Query.equal("scrapbookId", scrapbookId), Query.orderDesc("date")]
      );

      // Optimalizovať URL pre všetky memories
      const optimizedMemories = response.documents.map((memory) => ({
        ...memory,
        imageUrl: this.getOptimizedImageUrl(memory.imageUrl),
        thumbnailUrl: this.getOptimizedImageUrl(memory.imageUrl, {
          width: 400,
        }),
      }));

      return {
        ...response,
        documents: optimizedMemories,
      };
    } catch (error) {
      console.error("Get scrapbook memories error:", error);
      throw error;
    }
  },

  // Získanie konkrétnej spomienky
  async getMemory(memoryId) {
    try {
      const memory = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.MEMORIES,
        memoryId
      );

      return {
        ...memory,
        imageUrl: this.getOptimizedImageUrl(memory.imageUrl),
        thumbnailUrl: this.getOptimizedImageUrl(memory.imageUrl, {
          width: 400,
        }),
      };
    } catch (error) {
      console.error("Get memory error:", error);
      throw error;
    }
  },

  // Vymazanie spomienky
  async deleteMemory(memoryId, scrapbookId) {
    try {
      const memory = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.MEMORIES,
        memoryId
      );

      // Vymazanie z Cloudinary ak existuje
      if (memory.imageId && memory.imageId.includes("cloudinary")) {
        await this.deleteFromCloudinary(memory.imageId);
      }

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.MEMORIES,
        memoryId
      );

      await this.updateScrapbookMemoryCount(scrapbookId);

      return { success: true };
    } catch (error) {
      console.error("Delete memory error:", error);
      throw error;
    }
  },

  // Vymazanie z Cloudinary
  async deleteFromCloudinary(publicId) {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = this.generateCloudinarySignature(publicId, timestamp);

      const formData = new FormData();
      formData.append("public_id", publicId);
      formData.append("timestamp", timestamp);
      formData.append("api_key", CLOUDINARY_API_KEY);
      formData.append("signature", signature);

      await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
        {
          method: "POST",
          body: formData,
        }
      );
    } catch (error) {
      console.error("Delete from Cloudinary error:", error);
    }
  },

  // Aktualizácia počtu spomienok
  async updateScrapbookMemoryCount(scrapbookId) {
    try {
      const memories = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MEMORIES,
        [Query.equal("scrapbookId", scrapbookId)]
      );

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SCRAPBOOKS,
        scrapbookId,
        {
          memoriesCount: memories.total,
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Update scrapbook memory count error:", error);
    }
  },

  // Batch preload obrázkov
  async preloadImages(imageUrls) {
    const promises = imageUrls.map((url) => {
      if (url) {
        const optimizedUrl = this.getOptimizedImageUrl(url);
        return Image.prefetch(optimizedUrl).catch((err) =>
          console.warn("Preload failed for:", url, err)
        );
      }
      return Promise.resolve();
    });

    return Promise.allSettled(promises);
  },

  // Vyhľadávanie spomienok
  async searchMemories(scrapbookId, searchText) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MEMORIES,
        [
          Query.equal("scrapbookId", scrapbookId),
          Query.search("title", searchText),
          Query.orderDesc("date"),
        ]
      );

      const optimizedMemories = response.documents.map((memory) => ({
        ...memory,
        imageUrl: this.getOptimizedImageUrl(memory.imageUrl),
        thumbnailUrl: this.getOptimizedImageUrl(memory.imageUrl, {
          width: 400,
        }),
      }));

      return {
        ...response,
        documents: optimizedMemories,
      };
    } catch (error) {
      console.error("Search memories error:", error);
      throw error;
    }
  },

  // Clear image cache
  clearImageCache() {
    imageUrlCache.clear();
  },
  // Pridajte túto funkciu do vášho lib/memories.js súboru v rámci memoriesService objektu

  // Aktualizácia existujúcej spomienky
  async updateMemory(memoryId, memoryData, newImageFile) {
    try {
      console.log("🔄 UPDATING MEMORY:", memoryId);
      console.log("📝 UPDATE DATA:", memoryData);
      console.log("📸 NEW IMAGE FILE:", newImageFile);

      let imageUrl = memoryData.imageUrl; // zachovaj existujúci obrázok
      let imageId = memoryData.imageId;

      // Ak je poskytnutý nový obrázok
      if (newImageFile) {
        // Najprv vymaž starý obrázok ak existuje
        if (memoryData.imageId) {
          try {
            await this.deleteMemoryImage(memoryData.imageId);
          } catch (error) {
            console.warn("Failed to delete old image:", error);
          }
        }

        // Upload nového obrázka
        const uploadResponse = await this.uploadMemoryImage(newImageFile);
        imageUrl = uploadResponse.imageUrl;
        imageId = uploadResponse.imageId;
      }

      const updateData = {
        title: memoryData.title,
        description: memoryData.description || "",
        date: memoryData.date || new Date().toISOString(),
        location: memoryData.location || null,
        latitude: memoryData.latitude || null,
        longitude: memoryData.longitude || null,
        updatedAt: new Date().toISOString(),
      };

      // Pridaj image údaje iba ak sa zmenili
      if (newImageFile) {
        updateData.imageUrl = imageUrl;
        updateData.imageId = imageId;
      }

      console.log("💾 UPDATING MEMORY IN DATABASE:", updateData);

      const updatedMemory = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.MEMORIES,
        memoryId,
        updateData
      );

      console.log("✅ MEMORY UPDATED SUCCESSFULLY:", updatedMemory);

      return updatedMemory;
    } catch (error) {
      console.error("❌ UPDATE MEMORY ERROR:", error);
      throw error;
    }
  },
};
