// Edge-compatible Cloudinary signed upload using Web Crypto SHA-1.
// Avoids the Node `cloudinary` SDK, which imports http/https/stream at module
// scope and is incompatible with Cloudflare Pages edge runtime.
//
// Works in both runtimes (Node 18+ exposes Web Crypto via globalThis.crypto).

export interface CloudinaryEnv {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

async function cloudinarySign(
  params: Record<string, string>,
  apiSecret: string,
): Promise<string> {
  const sortedStr =
    Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&") + apiSecret;
  const buf = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(sortedStr),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function uploadToCloudinary(
  imageUrl: string,
  publicId: string,
  env: CloudinaryEnv,
): Promise<string | null> {
  // Try original URL, then unwrapped WP-proxy variant, then HTTPS upgrade.
  const urlsToTry = [imageUrl];
  if (/^https?:\/\/i\d\.wp\.com\//.test(imageUrl)) {
    urlsToTry.push(imageUrl.replace(/^https?:\/\/i\d\.wp\.com\//, "https://"));
  }
  if (imageUrl.startsWith("http://")) {
    urlsToTry.push(imageUrl.replace("http://", "https://"));
  }

  for (const tryUrl of urlsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signParams: Record<string, string> = {
          folder: "julies-cookbook",
          overwrite: "1",
          public_id: publicId,
          timestamp,
        };
        const signature = await cloudinarySign(signParams, env.apiSecret);
        const fd = new FormData();
        fd.append("file", tryUrl);
        fd.append("folder", "julies-cookbook");
        fd.append("public_id", publicId);
        fd.append("overwrite", "1");
        fd.append("timestamp", timestamp);
        fd.append("api_key", env.apiKey);
        fd.append("signature", signature);
        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${env.cloudName}/image/upload`,
          { method: "POST", body: fd },
        );
        if (cloudRes.ok) {
          const cloudData = (await cloudRes.json()) as { secure_url: string };
          return cloudData.secure_url;
        }
        console.error(
          `[scraper/cloudinary] HTTP ${cloudRes.status} attempt ${attempt + 1} for ${tryUrl}`,
        );
      } catch (err) {
        console.error(
          `[scraper/cloudinary] upload attempt ${attempt + 1} failed for ${tryUrl}:`,
          err,
        );
      }
    }
  }
  console.error(
    "[scraper/cloudinary] upload failed for all URL variants:",
    urlsToTry,
  );
  return null;
}
