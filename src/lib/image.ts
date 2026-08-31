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
 * Center-crop `file` to `aspect` (width / height), scaled so the output is at
 * most `maxWidth` wide, returned as a JPEG File. Transparent areas flatten to
 * white (JPEG has no alpha) — irrelevant for the typical opaque cover photo.
 */
export async function cropImageToAspect(file: File, aspect: number, maxWidth = 1600): Promise<File> {
  const img = await loadImage(await readAsDataUrl(file));

  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  if (!srcW || !srcH) throw new Error("That image has no dimensions.");

  // Largest centered crop of the source matching the target aspect.
  const srcAspect = srcW / srcH;
  let cropW: number;
  let cropH: number;
  if (srcAspect > aspect) {
    // Source too wide → trim the sides.
    cropH = srcH;
    cropW = Math.round(srcH * aspect);
  } else {
    // Source too tall (or exact) → trim top/bottom.
    cropW = srcW;
    cropH = Math.round(srcW / aspect);
  }
  const sx = Math.round((srcW - cropW) / 2);
  const sy = Math.round((srcH - cropH) / 2);

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
