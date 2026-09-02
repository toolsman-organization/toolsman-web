import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

/**
 * Upload a file buffer or base64 string to Cloudinary.
 * Server-side only. Never expose to browser.
 */
export async function uploadToCloudinary(
  file: string, // base64 data URI or file path
  folder: string = 'toolsman'
): Promise<CloudinaryUploadResult> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: 'image',
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  });

  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    resource_type: result.resource_type,
  };
}

/**
 * Delete an image from Cloudinary by its public_id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Generate an optimized Cloudinary URL with transformations.
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  } = {}
): string {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto:good',
    format = 'auto',
  } = options;

  const transformations: Record<string, unknown>[] = [
    { quality, fetch_format: format },
  ];

  if (width || height) {
    transformations.unshift({ width, height, crop });
  }

  return cloudinary.url(publicId, {
    secure: true,
    transformation: transformations,
  });
}

/**
 * Get product thumbnail URL (400x400).
 */
export function getProductThumbnail(
  publicIdOrUrl: string,
  size = 400
): string {
  if (!publicIdOrUrl) return '/placeholder-product.jpg';
  // If it's already a full URL (not a public_id), return as-is
  if (publicIdOrUrl.startsWith('http')) return publicIdOrUrl;
  return getOptimizedUrl(publicIdOrUrl, { width: size, height: size, crop: 'fill' });
}
