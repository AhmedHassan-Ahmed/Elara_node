import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";
import AppError from "../error/AppError.js";
import { env } from "../config/env.js";

export interface UploadResult {
  url: string;
  publicId: string;
}

export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/\/image\/upload\/(?:v\d+\/)?([^\.\?#]+)/);
  if (match && match[1]) return match[1];
  return null;
}

export function uploadImage(
  fileBuffer: Buffer,
  folder: string = "uploads",
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    if (!fileBuffer || !fileBuffer.length) {
      return reject(
        new AppError(
          400,
          "INVALID_FILE_BUFFER",
          "File buffer is empty or invalid",
        ),
      );
    }

    if (!env.cloudinaryCloudName || !env.cloudinaryApiKey) {
      return resolve({
        url: `https://res.cloudinary.com/demo/image/upload/v1234567890/${folder}/uploaded_image.jpg`,
        publicId: `${folder}/uploaded_image`,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            new AppError(
              500,
              "CLOUDINARY_UPLOAD_ERROR",
              error?.message || "Failed to upload image to Cloudinary",
            ),
          );
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
}

export async function deleteImage(publicIdOrUrl: string): Promise<void> {
  if (!publicIdOrUrl) return;

  const publicId = publicIdOrUrl.includes("http")
    ? extractPublicIdFromUrl(publicIdOrUrl)
    : publicIdOrUrl;

  if (!publicId) return;

  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err: any) {
    console.error(
      `[Cloudinary Media Service] Delete image error for ${publicId}:`,
      err,
    );
  }
}

export async function replaceImage(
  oldPublicIdOrUrl: string | undefined,
  newFileBuffer: Buffer,
  folder: string = "uploads",
): Promise<UploadResult> {
  const result = await uploadImage(newFileBuffer, folder);

  if (oldPublicIdOrUrl) {
    deleteImage(oldPublicIdOrUrl).catch((err) => {
      console.error(
        "[Cloudinary Media Service] Failed cleanup of old image:",
        err,
      );
    });
  }

  return result;
}
