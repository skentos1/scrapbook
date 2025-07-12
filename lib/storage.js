import { ID, storage } from "./appwrite";

export const storageService = {
  async uploadImage(imageUri) {
    try {
      // Convert URI to File object for upload
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const file = {
        name: `cover_${Date.now()}.jpg`,
        type: "image/jpeg",
        uri: imageUri,
        size: blob.size,
      };

      const result = await storage.createFile(
        "scrapbook_images", // Bucket ID
        ID.unique(),
        file
      );

      // Return the file URL
      return storage.getFileView("scrapbook_images", result.$id);
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  },
};
