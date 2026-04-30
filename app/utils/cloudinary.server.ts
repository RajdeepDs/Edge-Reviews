import { v2 as cloudinary } from "cloudinary";

export async function uploadReviewImage(file: File): Promise<string> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });

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
