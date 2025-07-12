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
  async getUserScrapbooks(userId) {
    try {
      return await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SCRAPBOOKS,
        [Query.equal("userId", userId), Query.orderDesc("createdAt")]
      );
    } catch (error) {
      console.error("Get user scrapbooks error:", error);
      throw error;
    }
  },

  // Aktualizácia scrapbooku
  async updateScrapbook(scrapbookId, updates) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SCRAPBOOKS,
        scrapbookId,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Update scrapbook error:", error);
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
};
