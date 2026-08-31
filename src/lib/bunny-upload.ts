// Hand-rolled TUS uploader for Bunny Stream — no `tus-js-client` dependency, so
// deploying stays "paste env keys + migrate" with zero new npm packages (the
// same hand-rolled ethos as the RS256 JWT minting on the backend).
//
// The whole point: the video BYTES go straight from the browser to Bunny. Our
// server only ever mints the short-lived signed envelope (see StaffVideoController
// ::createUpload); it never proxies the file. So this runs entirely client-side.
//
// Flow (Bunny TUS, verified against bunny.net/docs → tus-resumable-uploads):
//   1. POST {endpoint}  with the 4 auth headers + Upload-Length + Upload-Metadata
//      → 201/200 and a `Location` header (the per-upload URL).
//   2. PATCH {Location} with Upload-Offset: 0 and the file as the body
//      (Content-Type: application/offset+octet-stream) → 204. One PATCH uploads
//      the whole file; we use XHR so we get real upload progress.
//
// Auth headers (all four, on every request):
//   AuthorizationSignature = SHA256(library_id + api_key + expire + video_id)  ← minted server-side
//   AuthorizationExpire    = the UNIX-seconds expiry
//   LibraryId              = the Stream library id
//   VideoId                = the video guid

export type BunnyUploadSession = {
  provider: string;
  video_id: string;
  library_id: string;
  upload_endpoint: string;
  signature: string;
  expiration_time: number;
  collection_id?: string | null;
  embed_url: string;
  play_url?: string | null;
  thumbnail_url?: string | null;
  hls_url?: string | null;
};

// TUS Upload-Metadata values are base64; encode UTF-8 safely (titles may carry
// accents/emoji). btoa alone throws on non-Latin1 — the unescape/encodeURIComponent
// dance widens it to full UTF-8 first.
function b64(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

function authHeaders(session: BunnyUploadSession): Record<string, string> {
  return {
    AuthorizationSignature: session.signature,
    AuthorizationExpire: String(session.expiration_time),
    LibraryId: String(session.library_id),
    VideoId: session.video_id,
  };
}

/**
 * Upload one file to Bunny Stream for a pre-created video. Reports 0–100 progress
 * via onProgress. Resolves when Bunny has accepted every byte (the video then
 * transcodes server-side — poll videoStatus for readiness). Rejects with a
 * human-friendly Error on any failure.
 */
export async function uploadToBunny(
  session: BunnyUploadSession,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  // 1) Create the upload — POST returns the per-upload Location to PATCH into.
  const metadata = [
    `filetype ${b64(file.type || "video/mp4")}`,
    `title ${b64(file.name || "lesson video")}`,
    ...(session.collection_id ? [`collection ${b64(session.collection_id)}`] : []),
  ].join(",");

  const createRes = await fetch(session.upload_endpoint, {
    method: "POST",
    headers: {
      "Tus-Resumable": "1.0.0",
      "Upload-Length": String(file.size),
      "Upload-Metadata": metadata,
      ...authHeaders(session),
    },
  });

  if (createRes.status !== 201 && createRes.status !== 200) {
    throw new Error(`Could not start the upload (HTTP ${createRes.status}).`);
  }

  const location = createRes.headers.get("Location") || createRes.headers.get("location");
  if (!location) {
    throw new Error("The upload could not be started. Please try again.");
  }
  // Bunny may return a relative Location — resolve it against the endpoint's origin.
  const uploadUrl = new URL(location, session.upload_endpoint).toString();

  // 2) Send the bytes in a single PATCH via XHR so we get upload progress.
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PATCH", uploadUrl, true);
    xhr.setRequestHeader("Tus-Resumable", "1.0.0");
    xhr.setRequestHeader("Upload-Offset", "0");
    xhr.setRequestHeader("Content-Type", "application/offset+octet-stream");
    const headers = authHeaders(session);
    Object.keys(headers).forEach((k) => xhr.setRequestHeader(k, headers[k]));

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
      }
    };
    xhr.onload = () => {
      // TUS PATCH success is 204 (No Content); tolerate 200 as well.
      if (xhr.status === 204 || xhr.status === 200) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`The upload failed (HTTP ${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("The upload failed. Check your connection and try again."));
    xhr.onabort = () => reject(new Error("The upload was cancelled."));
    xhr.send(file);
  });
}
