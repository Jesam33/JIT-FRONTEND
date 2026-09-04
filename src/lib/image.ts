// Image helpers for owner uploads.
//
// cropImageToAspect center-crops a picked File to a target aspect ratio and caps
// its width, returning a new JPEG File. Course covers must be a uniform shape so
// the storefront grid reads cleanly — the card is `object-cover aspect-video`
// (16:9), so feeding it a pre-cropped 16:9 image fills the frame with no awkward
// letterboxing and no owner fighting an image editor to hit "the exact
// dimensions". Any image in, a clean 16:9 out.

/** Read a File as a data URL (so it can be decoded by an <img>). */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read the file."));
    r.readAsDataURL(file);
  });
}

/** Decode a data URL into an HTMLImageElement. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

/**
 * A focal point for a crop, as fractions of the source (0..1). {x:0.5,y:0.5} is
 * dead-centre; {y:0} pins the crop to the top edge, {x:1} to the right, etc.
 * Mirrors CSS `object-position` so a drag-to-position preview maps 1:1 onto the
 * actual crop. Values are clamped into range.
 */
export type CropFocus = { x: number; y: number };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Crop `file` to `aspect` (width / height), scaled so the output is at most
 * `maxWidth` wide, returned as a JPEG File. By default the crop is centred;
 * pass `focus` (0..1 fractions, like CSS object-position) to let the owner
 * choose which part of an over-wide / over-tall image the frame keeps.
 * Transparent areas flatten to white (JPEG has no alpha) — irrelevant for the
 * typical opaque cover photo.
 */
export async function cropImageToAspect(
  file: File,
  aspect: number,
  maxWidth = 1600,
  focus: CropFocus = { x: 0.5, y: 0.5 },
): Promise<File> {
  const img = await loadImage(await readAsDataUrl(file));

  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  if (!srcW || !srcH) throw new Error("That image has no dimensions.");

  const fx = clamp01(focus.x);
  const fy = clamp01(focus.y);

  // Largest crop of the source matching the target aspect, positioned by focus.
  const srcAspect = srcW / srcH;
  let cropW: number;
  let cropH: number;
  if (srcAspect > aspect) {
    // Source too wide → trim the sides; the focal X chooses which slice we keep.
    cropH = srcH;
    cropW = Math.round(srcH * aspect);
  } else {
    // Source too tall (or exact) → trim top/bottom; focal Y chooses the slice.
    cropW = srcW;
    cropH = Math.round(srcW / aspect);
  }
  const sx = Math.round((srcW - cropW) * fx);
  const sy = Math.round((srcH - cropH) * fy);

  const outW = Math.min(cropW, maxWidth);
  const outH = Math.round(outW / aspect);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process images.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, outW, outH);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("Could not process that image.");
  const base = (file.name || "cover").replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}
