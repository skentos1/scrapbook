import { Query } from "appwrite";
import { Platform } from "react-native";
import {
  COLLECTIONS,
  DATABASE_ID,
  databases,
  ID,
  storage,
  STORAGE_BUCKET_ID,
} from "./appwrite";
const CLOUDINARY_CLOUD_NAME = "drvop2yuc"; // napr. scrapbook-app
const CLOUDINARY_UPLOAD_PRESET = "scrapbook_unsigned";
const CLOUDINARY_FOLDER = "scrapbook"; // alebo nechaj prázdne

export const memoriesService = {
  // Vytvorenie novej spomienky
  async createMemory(scrapbookId, memoryData, imageFile) {
    try {
      // console.log("🚀 CREATING MEMORY FOR SCRAPBOOK:", scrapbookId);
      // console.log("📝 MEMORY DATA:", memoryData);
      // console.log("📸 IMAGE FILE:", imageFile);

      let imageUrl = null;
      let imageId = null;

      // if (imageFile) {
      //   // console.log("📤 STARTING IMAGE UPLOAD...");
      //   const uploadResponse = await this.uploadMemoryImage(imageFile);
      //   imageId = uploadResponse.$id;

      //   // console.log("✅ UPLOAD RESPONSE:", uploadResponse);

      //   imageUrl = this.getImageUrl(imageId);
      //   // console.log("🔗 GENERATED IMAGE URL:", imageUrl);
      // }
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

      // console.log("💾 SAVING MEMORY TO DATABASE:", memory);

      const createdMemory = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MEMORIES,
        ID.unique(),
        memory
      );

      // console.log("✅ MEMORY CREATED SUCCESSFULLY:", createdMemory);

      await this.updateScrapbookMemoryCount(scrapbookId);

      return createdMemory;
    } catch (error) {
      console.error("❌ CREATE MEMORY ERROR:", error);
      throw error;
    }
  },

  // Upload obrázka spomienky - APP write
  // async uploadMemoryImage(imageFile) {
  //   try {
  //     // console.log("=== UPLOAD START ===");
  //     // console.log("Image file:", imageFile);

  //     // 1. Načítame obrázok ako blob pomocou fetch
  //     const response = await fetch(imageFile.uri);
  //     const blob = await response.blob();

  //     // console.log("Blob created:", {
  //     //   size: blob.size,
  //     //   type: blob.type,
  //     // });

  //     // 2. Vytvoríme FormData
  //     const formData = new FormData();

  //     // DÔLEŽITÉ: Pre React Native musíme použiť špecifický formát
  //     formData.append("fileId", ID.unique());
  //     formData.append("file", {
  //       uri: imageFile.uri,
  //       type: imageFile.mimeType || imageFile.type || "image/jpeg",
  //       name: imageFile.fileName || `memory_${Date.now()}.jpg`,
  //     });

  //     // 3. Vytvoríme custom upload pomocou fetch API
  //     const uploadUrl = `${storage.client.config.endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files`;

  //     const uploadResponse = await fetch(uploadUrl, {
  //       method: "POST",
  //       headers: {
  //         "X-Appwrite-Project": storage.client.config.project,
  //         "X-Appwrite-Key": storage.client.config.key || "", // ak používate API key
  //       },
  //       body: formData,
  //     });

  //     if (!uploadResponse.ok) {
  //       const errorText = await uploadResponse.text();
  //       console.error("Upload failed with response:", errorText);
  //       throw new Error(
  //         `Upload failed: ${uploadResponse.status} - ${errorText}`
  //       );
  //     }

  //     const result = await uploadResponse.json();
  //     // console.log("Upload successful:", result);

  //     return result;
  //   } catch (error) {
  //     console.error("=== UPLOAD ERROR ===");
  //     console.error("Error details:", error);

  //     // Ak custom upload zlyhá, skúsime alternatívnu metódu
  //     return this.uploadMemoryImageAlternative(imageFile);
  //   }
  // },
  async uploadMemoryImage(imageFile) {
    try {
      const data = new FormData();
      data.append("file", {
        uri: imageFile.uri,
        type: imageFile.mimeType || imageFile.type || "image/jpeg",
        name: imageFile.fileName || `memory_${Date.now()}.jpg`,
      });
      data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      if (CLOUDINARY_FOLDER) {
        data.append("folder", CLOUDINARY_FOLDER);
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: data,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudinary upload failed: ${errorText}`);
      }

      const result = await response.json();

      // Cloudinary vráti URL obrázka ako `secure_url`
      return {
        imageUrl: result.secure_url,
        imageId: result.public_id,
      };
    } catch (error) {
      console.error("❌ Cloudinary upload failed:", error);
      throw error;
    }
  },

  // Alternatívna metóda pre upload
  async uploadMemoryImageAlternative(imageFile) {
    try {
      // console.log("Trying alternative upload method...");

      // Použijeme priamo Appwrite SDK s upravenými parametrami
      const fileId = ID.unique();

      // Vytvoríme file objekt kompatibilný s Appwrite
      const file = {
        name: imageFile.fileName || `memory_${Date.now()}.jpg`,
        type: imageFile.mimeType || "image/jpeg",
        size: imageFile.fileSize || imageFile.size,
        uri: imageFile.uri,
      };

      // Pre React Native, Appwrite očakáva špecifický formát
      if (Platform.OS === "ios") {
        // iOS špecifické úpravy
        file.uri = imageFile.uri.replace("file://", "");
      }

      // Skúsime upload s rôznymi metódami
      try {
        // Metóda 1: Priamy upload
        const result = await storage.createFile(
          STORAGE_BUCKET_ID,
          fileId,
          file
        );
        return result;
      } catch (e1) {
        // console.log("Direct upload failed, trying blob method...");

        // Metóda 2: Blob upload
        const response = await fetch(imageFile.uri);
        const blob = await response.blob();

        // Pridáme potrebné vlastnosti pre Appwrite
        Object.defineProperty(blob, "name", {
          value: file.name,
          writable: false,
        });

        Object.defineProperty(blob, "uri", {
          value: imageFile.uri,
          writable: false,
        });

        const result = await storage.createFile(
          STORAGE_BUCKET_ID,
          fileId,
          blob
        );

        return result;
      }
    } catch (error) {
      console.error("Alternative upload also failed:", error);

      // Posledná možnosť - base64 upload
      return this.uploadMemoryImageBase64(imageFile);
    }
  },

  // Base64 upload ako posledná možnosť
  async uploadMemoryImageBase64(imageFile) {
    try {
      // console.log("Trying base64 upload method...");

      // Konvertujeme obrázok na base64
      const response = await fetch(imageFile.uri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64data = reader.result;
            const base64String = base64data.split(",")[1];

            // Vytvoríme Blob z base64
            const byteCharacters = atob(base64String);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const newBlob = new Blob([byteArray], {
              type: imageFile.mimeType || "image/jpeg",
            });

            // Pridáme name property
            Object.defineProperty(newBlob, "name", {
              value: imageFile.fileName || `memory_${Date.now()}.jpg`,
              writable: false,
            });

            const result = await storage.createFile(
              STORAGE_BUCKET_ID,
              ID.unique(),
              newBlob
            );

            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Base64 upload failed:", error);
      throw new Error(
        "Všetky metódy uploadu zlyhali. Skontrolujte nastavenia Appwrite storage bucketu."
      );
    }
  },

  // Získanie konkrétnej spomienky
  async getMemory(memoryId) {
    try {
      return await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.MEMORIES,
        memoryId
      );
    } catch (error) {
      console.error("Get memory error:", error);
      throw error;
    }
  },

  // Získanie spomienok pre konkrétny scrapbook
  async getScrapbookMemories(scrapbookId) {
    try {
      // console.log("📥 FETCHING MEMORIES FOR SCRAPBOOK:", scrapbookId);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MEMORIES,
        [Query.equal("scrapbookId", scrapbookId), Query.orderDesc("date")]
      );

      // console.log("📥 FETCHED MEMORIES:", response);

      // Debug každú memory
      // response.documents?.forEach((memory, index) => {
      //   console.log(`📋 MEMORY ${index + 1} DETAILS:`, {
      //     id: memory.$id,
      //     title: memory.title,
      //     imageId: memory.imageId,
      //     storedImageUrl: memory.imageUrl,
      //     freshImageUrl: memory.imageId
      //       ? this.getImageUrl(memory.imageId)
      //       : null,
      //     createdAt: memory.createdAt,
      //   });
      // });

      return response;
    } catch (error) {
      console.error("❌ GET SCRAPBOOK MEMORIES ERROR:", error);
      throw error;
    }
  },

  // Vymazanie spomienky
  async deleteMemory(memoryId, scrapbookId) {
    try {
      // Najprv získame spomienku pre imageId
      const memory = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.MEMORIES,
        memoryId
      );

      // Vymazanie obrázka ak existuje
      if (memory.imageId) {
        await this.deleteMemoryImage(memory.imageId);
      }

      // Vymazanie spomienky
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.MEMORIES,
        memoryId
      );

      // Aktualizácia počtu spomienok v scrapbooku
      await this.updateScrapbookMemoryCount(scrapbookId);

      return { success: true };
    } catch (error) {
      console.error("Delete memory error:", error);
      throw error;
    }
  },

  // Vymazanie obrázka spomienky
  async deleteMemoryImage(imageId) {
    try {
      return await storage.deleteFile(STORAGE_BUCKET_ID, imageId);
    } catch (error) {
      console.error("Delete memory image error:", error);
      throw error;
    }
  },

  // Získanie URL obrázka
  // getImageUrl(imageId) {
  //   if (!imageId) return null;

  //   // console.log("🔗 GENERATING IMAGE URL FOR:", imageId);

  //   const endpoint = storage.client.config.endpoint;
  //   const projectId = storage.client.config.project;

  //   // console.log("🔧 STORAGE CONFIG:", {
  //   //   endpoint,
  //   //   projectId,
  //   //   bucket: STORAGE_BUCKET_ID,
  //   // });

  //   // Skús všetky možné URL formáty
  //   const urls = {
  //     directView: `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${imageId}/view?project=${projectId}`,
  //     preview800: `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${imageId}/preview?width=800&height=600&project=${projectId}`,
  //     previewSimple: `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${imageId}/preview?project=${projectId}`,
  //     download: `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${imageId}/download?project=${projectId}`,
  //   };

  //   // console.log("🔗 GENERATED URLS:", urls);

  //   // Vráť direct view URL (najprostší)
  //   return urls.directView;
  // },
  // getImageUrl(imageId) {
  //   if (!imageId) return null;

  //   const endpoint = storage.client.config.endpoint;
  //   const projectId = storage.client.config.project;

  //   return `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${imageId}/preview?width=800&height=600&quality=80&project=${projectId}`;
  // },

  // Aktualizácia počtu spomienok v scrapbooku
  async updateScrapbookMemoryCount(scrapbookId) {
    try {
      const memories = await this.getScrapbookMemories(scrapbookId);

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SCRAPBOOKS,
        scrapbookId,
        {
          memoriesCount: memories.documents.length,
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Update scrapbook memory count error:", error);
    }
  },

  // Vyhľadávanie spomienok podľa textu
  async searchMemories(scrapbookId, searchText) {
    try {
      return await databases.listDocuments(DATABASE_ID, COLLECTIONS.MEMORIES, [
        Query.equal("scrapbookId", scrapbookId),
        Query.search("title", searchText),
        Query.orderDesc("date"),
      ]);
    } catch (error) {
      console.error("Search memories error:", error);
      throw error;
    }
  },

  // Získanie spomienok v určitom časovom rozmedzí
  async getMemoriesByDateRange(scrapbookId, startDate, endDate) {
    try {
      return await databases.listDocuments(DATABASE_ID, COLLECTIONS.MEMORIES, [
        Query.equal("scrapbookId", scrapbookId),
        Query.greaterThanEqual("date", startDate),
        Query.lessThanEqual("date", endDate),
        Query.orderDesc("date"),
      ]);
    } catch (error) {
      console.error("Get memories by date range error:", error);
      throw error;
    }
  },

  // Získanie spomienok s lokáciou
  async getMemoriesWithLocation(scrapbookId) {
    try {
      return await databases.listDocuments(DATABASE_ID, COLLECTIONS.MEMORIES, [
        Query.equal("scrapbookId", scrapbookId),
        Query.isNotNull("latitude"),
        Query.isNotNull("longitude"),
        Query.orderDesc("date"),
      ]);
    } catch (error) {
      console.error("Get memories with location error:", error);
      throw error;
    }
  },
};
