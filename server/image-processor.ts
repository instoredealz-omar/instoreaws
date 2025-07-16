import sharp from 'sharp';
import { Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Configuration for image processing
const IMAGE_CONFIG = {
  width: 600,
  height: 400,
  quality: 85,
  format: 'webp' as const,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
};

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is an image
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (!IMAGE_CONFIG.allowedFormats.includes(ext)) {
    return cb(new Error(`Only ${IMAGE_CONFIG.allowedFormats.join(', ')} files are allowed`));
  }
  
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: IMAGE_CONFIG.maxFileSize,
  },
  fileFilter,
});

/**
 * Process uploaded image to fit deal card requirements
 * - Resize to 600x400 pixels
 * - Crop to 4:3 aspect ratio
 * - Compress and convert to WebP
 */
export async function processImage(imageBuffer: Buffer, filename: string): Promise<{
  filename: string;
  path: string;
  url: string;
  size: number;
  dimensions: { width: number; height: number };
}> {
  try {
    // Generate unique filename
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const webpFilename = `${uniqueId}-${Date.now()}.webp`;
    const filepath = path.join(uploadsDir, webpFilename);

    // Get original image metadata
    const metadata = await sharp(imageBuffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image dimensions');
    }

    // Calculate crop dimensions for 4:3 aspect ratio
    const targetAspectRatio = 4 / 3;
    const originalAspectRatio = metadata.width / metadata.height;
    
    let cropWidth = metadata.width;
    let cropHeight = metadata.height;
    let cropLeft = 0;
    let cropTop = 0;

    if (originalAspectRatio > targetAspectRatio) {
      // Image is wider than target - crop width
      cropWidth = Math.round(metadata.height * targetAspectRatio);
      cropLeft = Math.round((metadata.width - cropWidth) / 2);
    } else if (originalAspectRatio < targetAspectRatio) {
      // Image is taller than target - crop height
      cropHeight = Math.round(metadata.width / targetAspectRatio);
      cropTop = Math.round((metadata.height - cropHeight) / 2);
    }

    // Process the image
    const processedBuffer = await sharp(imageBuffer)
      .extract({
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight,
      })
      .resize(IMAGE_CONFIG.width, IMAGE_CONFIG.height, {
        fit: 'fill',
        withoutEnlargement: false,
      })
      .webp({
        quality: IMAGE_CONFIG.quality,
        effort: 6, // Higher effort for better compression
      })
      .toBuffer();

    // Save processed image
    await fs.promises.writeFile(filepath, processedBuffer);

    // Get final file size
    const stats = await fs.promises.stat(filepath);

    return {
      filename: webpFilename,
      path: filepath,
      url: `/uploads/${webpFilename}`,
      size: stats.size,
      dimensions: {
        width: IMAGE_CONFIG.width,
        height: IMAGE_CONFIG.height,
      },
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Process base64 image data
 */
export async function processBase64Image(base64Data: string): Promise<{
  filename: string;
  path: string;
  url: string;
  size: number;
  dimensions: { width: number; height: number };
}> {
  try {
    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64String, 'base64');
    
    return await processImage(imageBuffer, 'base64-image');
  } catch (error) {
    console.error('Base64 image processing error:', error);
    throw new Error('Failed to process base64 image');
  }
}

/**
 * Process image from URL
 */
export async function processImageFromUrl(imageUrl: string): Promise<{
  filename: string;
  path: string;
  url: string;
  size: number;
  dimensions: { width: number; height: number };
}> {
  try {
    // Fetch image from URL
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    
    return await processImage(imageBuffer, 'url-image');
  } catch (error) {
    console.error('URL image processing error:', error);
    throw new Error('Failed to process image from URL');
  }
}

/**
 * Delete processed image file
 */
export async function deleteImage(filename: string): Promise<boolean> {
  try {
    const filepath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

/**
 * Get image processing configuration
 */
export function getImageConfig() {
  return IMAGE_CONFIG;
}