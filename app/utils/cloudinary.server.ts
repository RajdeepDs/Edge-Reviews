import { v2 as cloudinary } from "cloudinary";

export const CLOUDINARY_URL_PREFIX = "https://res.cloudinary.com/";

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });
}

export async function uploadReviewImageFromUrl(url: string): Promise<string | null> {
  if (!url?.trim()) return null;
  configureCloudinary();
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder: "edge-reviews",
      format: "avif",
      quality: "auto:best",
    });
    return result.secure_url;
  } catch {
    return null;
  }
}

export async function uploadReviewImage(file: File): Promise<string> {
  configureCloudinary();

  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "edge-reviews",
          format: "avif",
          quality: "auto:best",
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve(result.secure_url);
        },
      )
      .end(buffer);
  });
}
