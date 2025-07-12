import { Query } from "appwrite";
import {
  COLLECTIONS,
  DATABASE_ID,
  databases,
  ID,
  storage,
  STORAGE_BUCKET_ID,
} from "./appwrite";

export const scrapbookService = {
  // Vytvorenie nového scrapbooku
  async createScrapbook(title, description, userId, coverImage = null) {
    try {
      console.log("Creating scrapbook for user:", userId);
      const scrapbookData = {
        title,
        description,
        userId: userId, // alebo userId podľa tvojho nastavenia
        coverImage, // Tu sa uloží URI obrázka
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        memoriesCount: 0,
      };

      return await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SCRAPBOOKS,
        ID.unique(),
        scrapbookData
      );
    } catch (error) {
      console.error("Create scrapbook error:", error);
      throw error;
    }
  },

  // Získanie konkrétneho scrapbooku
  async getScrapbook(scrapbookId) {
    try {
      return await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.SCRAPBOOKS,
        scrapbookId
      );
    } catch (error) {
      console.error("Get scrapbook error:", error);
      throw error;
    }
  },

  // Získanie scrapbookov používateľa
  async getUserScrapbooks(userId, orderByFavorites = false) {
    try {
      let queries = [Query.equal("userId", userId)];

      if (orderByFavorites) {
        // Najprv favorite, potom ostatné
        queries.push(Query.orderDesc("isFavourite"));
        queries.push(Query.orderDesc("updatedAt"));
      } else {
        // Štandardné triedenie
        queries.push(Query.orderDesc("createdAt"));
      }

      return await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SCRAPBOOKS,
        queries
      );
    } catch (error) {
      console.error("Get user scrapbooks error:", error);
      throw error;
    }
  },

  // Aktualizácia scrapbooku
  async updateScrapbook(scrapbookId, updates) {
    try {
      console.log("🔄 UPDATING SCRAPBOOK:", scrapbookId);
      console.log("📝 UPDATE DATA:", updates);

      let coverImageUrl = updates.coverImage;
      let coverImageId = null;

      // Ak je poskytnutý nový cover image ako súbor (nie URL)
      if (updates.coverImage && updates.coverImage.startsWith("file://")) {
        try {
          // Vymaž starý cover image ak existuje
          const currentScrapbook = await this.getScrapbook(scrapbookId);
          if (currentScrapbook.coverImageId) {
            try {
              await this.deleteCoverImage(currentScrapbook.coverImageId);
            } catch (error) {
              console.warn("Failed to delete old cover image:", error);
            }
          }

          // Upload nového cover image
          const uploadResponse = await this.uploadCoverImage({
            uri: updates.coverImage,
            type: "image/jpeg",
            fileName: `cover_${Date.now()}.jpg`,
            mimeType: "image/jpeg",
          });

          coverImageUrl = uploadResponse.imageUrl || uploadResponse.uri;
          coverImageId = uploadResponse.imageId;
        } catch (error) {
          console.error("Failed to upload new cover image:", error);
          // Pokračuj bez nahratia obrázka
          coverImageUrl = updates.coverImage;
        }
      }

      const updateData = {
        ...updates,
        coverImage: coverImageUrl,
        updatedAt: new Date().toISOString(),
      };

      // Pridaj coverImageId iba ak sa zmenil
      if (coverImageId) {
        updateData.coverImageId = coverImageId;
      }

      // Odstráň pôvodnú coverImage ak bola nahradená
      if (updates.coverImage && updates.coverImage.startsWith("file://")) {
        delete updateData.coverImage;
        updateData.coverImage = coverImageUrl;
      }

      console.log("💾 UPDATING SCRAPBOOK IN DATABASE:", updateData);

      const updatedScrapbook = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SCRAPBOOKS,
        scrapbookId,
        updateData
      );

      console.log("✅ SCRAPBOOK UPDATED SUCCESSFULLY:", updatedScrapbook);
      return updatedScrapbook;
    } catch (error) {
      console.error("❌ UPDATE SCRAPBOOK ERROR:", error);
      throw error;
    }
  },

  // Vymazanie scrapbooku
  async deleteScrapbook(scrapbookId) {
    try {
      // Najprv vymazať všetky spomienky v scrapbooku
      const memoriesResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MEMORIES,
        [Query.equal("scrapbookId", scrapbookId)]
      );

      // Vymazanie všetkých spomienok
      for (const memory of memoriesResponse.documents) {
        if (memory.imageId) {
          await storage.deleteFile(STORAGE_BUCKET_ID, memory.imageId);
        }
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.MEMORIES,
          memory.$id
        );
      }

      // Vymazanie cover image ak existuje
      const scrapbook = await this.getScrapbook(scrapbookId);
      if (scrapbook.coverImageId) {
        await storage.deleteFile(STORAGE_BUCKET_ID, scrapbook.coverImageId);
      }

      // Vymazanie scrapbooku
      return await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.SCRAPBOOKS,
        scrapbookId
      );
    } catch (error) {
      console.error("Delete scrapbook error:", error);
      throw error;
    }
  },

  // Upload cover image
  async uploadCoverImage(file) {
    try {
      // Vytvorenie súboru s prefixom pre identifikáciu
      const imageFile = {
        name: `scrapbook_${Date.now()}.jpg`,
        type: file.type || "image/jpeg",
        uri: file.uri,
        size: file.fileSize || 0,
      };

      return await storage.createFile(
        STORAGE_BUCKET_ID, // Jeden bucket pre všetky obrázky
        ID.unique(),
        imageFile
      );
    } catch (error) {
      console.error("Upload cover image error:", error);
      throw error;
    }
  },

  // Získanie URL cover image
  getCoverImageUrl(imageId) {
    if (!imageId) return null;
    return storage.getFilePreview(STORAGE_BUCKET_ID, imageId, 800, 600);
  },

  // Vyhľadávanie scrapbookov
  async searchScrapbooks(userId, searchText) {
    try {
      return await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SCRAPBOOKS,
        [
          Query.equal("userId", userId),
          Query.search("title", searchText),
          Query.orderDesc("createdAt"),
        ]
      );
    } catch (error) {
      console.error("Search scrapbooks error:", error);
      throw error;
    }
  },

  // Získanie štatistík používateľa
  async getUserStats(userId) {
    try {
      const scrapbooks = await this.getUserScrapbooks(userId);
      const totalMemories = scrapbooks.documents.reduce(
        (sum, scrapbook) => sum + (scrapbook.memoriesCount || 0),
        0
      );

      return {
        totalScrapbooks: scrapbooks.documents.length,
        totalMemories,
        latestScrapbook: scrapbooks.documents[0] || null,
      };
    } catch (error) {
      console.error("Get user stats error:", error);
      throw error;
    }
  },
  async toggleFavoriteScrapbook(scrapbookId, isFavorite) {
    try {
      console.log("🌟 TOGGLING FAVORITE:", scrapbookId, isFavorite);

      const updatedScrapbook = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SCRAPBOOKS,
        scrapbookId,
        {
          isFavourite: !isFavorite, // Toggle hodnotu
          updatedAt: new Date().toISOString(),
        }
      );

      console.log("✅ FAVORITE UPDATED:", updatedScrapbook);
      return updatedScrapbook;
    } catch (error) {
      console.error("❌ TOGGLE FAVORITE ERROR:", error);
      throw error;
    }
  },
  async getFavoriteScrapbooks(userId) {
    try {
      return await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SCRAPBOOKS,
        [
          Query.equal("userId", userId),
          Query.equal("isFavourite", true),
          Query.orderDesc("updatedAt"),
        ]
      );
    } catch (error) {
      console.error("Get favorite scrapbooks error:", error);
      throw error;
    }
  },
};
