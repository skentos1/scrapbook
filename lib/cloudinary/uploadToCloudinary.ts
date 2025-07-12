// lib/uploadToCloudinary.ts
export async function uploadToCloudinary(imageFile: {
  uri: string;
  type?: string;
  fileName?: string;
}): Promise<string> {
  const data = new FormData();

  data.append("file", {
    uri: imageFile.uri,
    type: imageFile.type || "image/jpeg",
    name: imageFile.fileName || `memory_${Date.now()}.jpg`,
  } as any); // 👈 `as any` kvôli TypeScript/React Native FormData type

  data.append("upload_preset", "scrapbook_unsigned");

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/drvop2yuc/image/upload",
    {
      method: "POST",
      body: data,
    }
  );

  const json = await response.json();

  if (!json.secure_url) {
    throw new Error("Cloudinary upload failed");
  }

  return json.secure_url;
}
