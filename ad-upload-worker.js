/**
 * Cloudflare Worker — R2 video upload handler for Ad Simulator
 *
 * Setup steps in the Cloudflare dashboard after deploying:
 *  1. Worker Settings → Variables → R2 Bucket Bindings:
 *       Variable name:  BUCKET
 *       R2 bucket:      ad-simulator
 *  2. Worker Settings → Variables → Environment Variables:
 *       Variable name:  PUBLIC_BUCKET_URL
 *       Value:          https://pub-0fb5a4483ae74afa8e7e72314ac0adc6.r2.dev
 *  3. Copy the Worker URL and paste it into WORKER_URL in AdSimulator_1.jsx
 */

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const ALLOWED_TYPES = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES];
const MAX_BYTES = 200 * 1024 * 1024; // 200 MB

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(request.url);

  if (request.method === "POST" && url.pathname === "/upload") {
    return handleUpload(request);
  }

  if (request.method === "DELETE" && url.pathname === "/delete") {
    return handleDelete(request);
  }

  if (request.method === "POST" && url.pathname === "/cleanup") {
    return handleCleanup(request);
  }

  return new Response("Not found", { status: 404, headers: corsHeaders() });
}

async function handleUpload(request) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, "Invalid form data");
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return errorResponse(400, "No file provided");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return errorResponse(400, `Unsupported file type: ${file.type}. Videos: mp4, webm, ogg. Images: jpeg, png.`);
  }

  if (file.size > MAX_BYTES) {
    return errorResponse(400, `File too large (${Math.round(file.size / 1024 / 1024)} MB). Max is 200 MB.`);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const prefix = ALLOWED_IMAGE_TYPES.includes(file.type) ? "images" : "videos";
  const key = `${prefix}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  try {
    await BUCKET.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
  } catch {
    return errorResponse(500, "Upload to R2 failed");
  }

  const publicUrl = `${PUBLIC_BUCKET_URL}/${key}`;
  return new Response(JSON.stringify({ url: publicUrl }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function errorResponse(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

async function handleDelete(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Invalid JSON");
  }

  const { url } = body;
  if (!url || typeof url !== "string") {
    return errorResponse(400, "No URL provided");
  }

  const key = url.replace(`${PUBLIC_BUCKET_URL}/`, "");
  if (!key || key === url) {
    return errorResponse(400, "URL does not match this bucket");
  }

  try {
    await BUCKET.delete(key);
  } catch {
    return errorResponse(500, "Delete from R2 failed");
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

async function handleCleanup(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Invalid JSON");
  }

  const { keepUrls } = body;
  if (!Array.isArray(keepUrls)) {
    return errorResponse(400, "keepUrls must be an array");
  }

  const keepKeys = new Set(
    keepUrls
      .filter(url => typeof url === "string" && url.includes(".r2.dev/"))
      .map(url => url.replace(`${PUBLIC_BUCKET_URL}/`, ""))
  );

  let deleted = 0;
  for (const prefix of ["videos/", "images/"]) {
    let cursor;
    do {
      const listed = await BUCKET.list({ prefix, cursor });
      for (const obj of listed.objects) {
        if (!keepKeys.has(obj.key)) {
          await BUCKET.delete(obj.key);
          deleted++;
        }
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);
  }

  return new Response(JSON.stringify({ deleted }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
