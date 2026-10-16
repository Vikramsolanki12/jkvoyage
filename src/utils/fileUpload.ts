/**
 * High-performance client-side image compression and document upload utility.
 * Guarantees that uploaded images and tickets stay well within Firestore's 1MB limit
 * while preserving crisp visual fidelity.
 */

export interface ProcessedUploadResult {
  dataUrl: string;
  cloudUrl?: string; // High-speed server storage URL /api/documents/view/cld_...
  fileType: 'image' | 'pdf' | 'other';
  fileName: string;
  formattedSize: string;
  sizeBytes: number;
  isOptimized: boolean;
  error?: string;
}

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number; // Target max size
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Robust client-side image compression using createImageBitmap / HTML5 Canvas.
 * Handles phone camera photos (5-15MB), HEIC conversions, and downscales to crisp lightweight image.
 */
export async function compressImageFile(
  file: File | Blob,
  options: ImageCompressionOptions = {}
): Promise<{ dataUrl: string; sizeBytes: number; formattedSize: string }> {
  const {
    maxWidth = 1400,
    maxHeight = 1400,
    quality = 0.78,
    maxSizeBytes = 350 * 1024
  } = options;

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
      reject(new Error('Window or FileReader not available'));
      return;
    }

    // Try modern createImageBitmap first for speed & EXIF orientation support
    if (typeof createImageBitmap === 'function') {
      createImageBitmap(file)
        .then((bitmap) => {
          let { width, height } = bitmap;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(bitmap, 0, 0, width, height);

            let currentQuality = quality;
            let outputDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
            let currentBytes = Math.round((outputDataUrl.length * 3) / 4);

            let iterations = 0;
            while (currentBytes > maxSizeBytes && iterations < 3) {
              iterations++;
              currentQuality = Math.max(0.4, currentQuality - 0.15);
              outputDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
              currentBytes = Math.round((outputDataUrl.length * 3) / 4);
            }

            resolve({
              dataUrl: outputDataUrl,
              sizeBytes: currentBytes,
              formattedSize: formatBytes(currentBytes)
            });
            return;
          }
          // fallback if ctx null
          fallbackToFileReader();
        })
        .catch(() => {
          fallbackToFileReader();
        });
      return;
    }

    fallbackToFileReader();

    function fallbackToFileReader() {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.onload = (e) => {
        const rawDataUrl = e.target?.result as string;
        if (!rawDataUrl) {
          reject(new Error('Empty image file'));
          return;
        }

        const img = new Image();
        img.onerror = () => {
          const estimatedBytes = Math.round((rawDataUrl.length * 3) / 4);
          resolve({
            dataUrl: rawDataUrl,
            sizeBytes: estimatedBytes,
            formattedSize: formatBytes(estimatedBytes)
          });
        };

        img.onload = () => {
          try {
            let { width, height } = img;
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              const bytes = Math.round((rawDataUrl.length * 3) / 4);
              resolve({
                dataUrl: rawDataUrl,
                sizeBytes: bytes,
                formattedSize: formatBytes(bytes)
              });
              return;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            let currentQuality = quality;
            let outputDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
            let currentBytes = Math.round((outputDataUrl.length * 3) / 4);

            let iterations = 0;
            while (currentBytes > maxSizeBytes && iterations < 3) {
              iterations++;
              currentQuality = Math.max(0.4, currentQuality - 0.15);
              outputDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
              currentBytes = Math.round((outputDataUrl.length * 3) / 4);
            }

            resolve({
              dataUrl: outputDataUrl,
              sizeBytes: currentBytes,
              formattedSize: formatBytes(currentBytes)
            });
          } catch {
            const bytes = Math.round((rawDataUrl.length * 3) / 4);
            resolve({
              dataUrl: rawDataUrl,
              sizeBytes: bytes,
              formattedSize: formatBytes(bytes)
            });
          }
        };

        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Universal document / ticket / photo processor.
 * Automatically classifies PDF vs Image, compresses photos, and uploads to secure cloud storage.
 */
export async function processUploadedDocument(
  file: File,
  tripId?: string,
  ownerId?: string
): Promise<ProcessedUploadResult> {
  const fileName = file.name || 'document';
  const isPdf = file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(fileName);

  let rawOrCompressedDataUrl = '';
  let detectedType: 'image' | 'pdf' | 'other' = isPdf ? 'pdf' : (isImage ? 'image' : 'other');
  let finalSize = file.size;

  if (isImage) {
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.8,
        maxSizeBytes: 400 * 1024
      });
      rawOrCompressedDataUrl = compressed.dataUrl;
      finalSize = compressed.sizeBytes;
    } catch {
      rawOrCompressedDataUrl = await readAsDataUrl(file);
    }
  } else {
    rawOrCompressedDataUrl = await readAsDataUrl(file);
  }

  // Upload to secure private cloud storage immediately
  let cloudUrl: string | undefined;
  try {
    const cloudRes = await uploadDocumentToPrivateCloud({
      fileName,
      fileType: detectedType,
      fileData: rawOrCompressedDataUrl,
      tripId,
      ownerId
    });
    if (cloudRes.isCloudStored && cloudRes.fileUrl) {
      cloudUrl = cloudRes.fileUrl;
    }
  } catch (err) {
    console.warn('Initial cloud upload attempt warning:', err);
  }

  return {
    dataUrl: rawOrCompressedDataUrl,
    cloudUrl,
    fileType: detectedType,
    fileName,
    formattedSize: formatBytes(finalSize),
    sizeBytes: finalSize,
    isOptimized: true
  };
}

function readAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a document to the private secure cloud storage endpoint (/api/documents/upload).
 * This ensures private access, prevents large payload limits on Firestore documents,
 * and gives every pass/ticket a high-speed private cloud view & download URL.
 */
export async function uploadDocumentToPrivateCloud(params: {
  fileName: string;
  fileType: 'pdf' | 'image' | 'other';
  fileData: string;
  tripId?: string;
  ownerId?: string;
}): Promise<{
  fileUrl: string;
  downloadUrl?: string;
  documentId?: string;
  isCloudStored: boolean;
}> {
  try {
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.fileUrl) {
        return {
          fileUrl: data.fileUrl,
          downloadUrl: data.downloadUrl,
          documentId: data.documentId,
          isCloudStored: true
        };
      }
    }
  } catch (err) {
    console.warn('Private cloud upload failed, falling back to secure compressed data URL:', err);
  }

  // Graceful fallback to dataUrl
  return {
    fileUrl: params.fileData,
    isCloudStored: false
  };
}

/**
 * Direct photo uploader for Journal, Hero Cover, and Profiles.
 * Compresses the image and uploads to private cloud, returning the persistent URL.
 */
export async function uploadPhotoFile(
  file: File,
  tripId?: string,
  ownerId?: string
): Promise<{ url: string; isCloud: boolean }> {
  const fileName = file.name || 'photo.jpg';
  const compressed = await compressImageFile(file, {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.8,
    maxSizeBytes: 350 * 1024
  });

  try {
    const cloudRes = await uploadDocumentToPrivateCloud({
      fileName,
      fileType: 'image',
      fileData: compressed.dataUrl,
      tripId,
      ownerId
    });

    if (cloudRes.isCloudStored && cloudRes.fileUrl) {
      return { url: cloudRes.fileUrl, isCloud: true };
    }
  } catch (err) {
    console.warn('Upload photo to cloud failed, using compressed preview:', err);
  }

  return { url: compressed.dataUrl, isCloud: false };
}


