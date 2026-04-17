const MAX_EDGE_PX = 1600;
const TARGET_BYTES = 1_500_000;
const INITIAL_QUALITY = 0.82;
const MIN_QUALITY = 0.55;
const SCALE_STEP = 0.85;

const loadImageBitmap = async (file: File) => {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Unable to decode image for upload."));
      element.src = objectUrl;
    });

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const renderToBlob = async (
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
  quality: number,
) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to prepare image upload canvas.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );

  if (!blob) {
    throw new Error("Unable to prepare image upload blob.");
  }

  return blob;
};

export const prepareImg2SixWUpload = async (file: File): Promise<File> => {
  const bitmap = await loadImageBitmap(file);

  try {
    const originalWidth = "width" in bitmap ? bitmap.width : 0;
    const originalHeight = "height" in bitmap ? bitmap.height : 0;

    if (!originalWidth || !originalHeight) {
      return file;
    }

    const edgeRatio = Math.min(1, MAX_EDGE_PX / Math.max(originalWidth, originalHeight));
    let width = Math.max(1, Math.round(originalWidth * edgeRatio));
    let height = Math.max(1, Math.round(originalHeight * edgeRatio));
    let quality = INITIAL_QUALITY;

    let blob = await renderToBlob(bitmap, width, height, quality);

    while (blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.08);
      blob = await renderToBlob(bitmap, width, height, quality);
    }

    while (blob.size > TARGET_BYTES && width > 900 && height > 900) {
      width = Math.max(1, Math.round(width * SCALE_STEP));
      height = Math.max(1, Math.round(height * SCALE_STEP));
      quality = INITIAL_QUALITY;
      blob = await renderToBlob(bitmap, width, height, quality);

      while (blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
        quality = Math.max(MIN_QUALITY, quality - 0.08);
        blob = await renderToBlob(bitmap, width, height, quality);
      }
    }

    if (blob.size >= file.size && file.size <= TARGET_BYTES) {
      return file;
    }

    const normalizedName = file.name.replace(/\.(png|webp|heic|heif)$/i, ".jpeg");
    return new File([blob], normalizedName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    if ("close" in bitmap && typeof bitmap.close === "function") {
      bitmap.close();
    }
  }
};

