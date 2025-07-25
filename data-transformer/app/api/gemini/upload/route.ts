import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

async function uploadToGemini(file: File, buffer: Buffer) {
  console.log("[Gemini Upload] Starting Gemini resumable upload");
  
  // Initial resumable request
  const initResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/files?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": buffer.length.toString(),
        "X-Goog-Upload-Header-Content-Type": file.type,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: {
          display_name: file.name
        }
      })
    }
  );

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    console.error("[Gemini Upload] Init response error:", {
      status: initResponse.status,
      statusText: initResponse.statusText,
      headers: Object.fromEntries(initResponse.headers.entries()),
      body: errorText
    });
    throw new Error(`Failed to initialize upload: ${initResponse.statusText} - ${errorText}`);
  }

  // Log all response headers
  console.log("[Gemini Upload] Init response headers:", 
    Object.fromEntries(initResponse.headers.entries())
  );

  // The header name might be lowercase
  const uploadUrl = initResponse.headers.get("x-goog-upload-url") || 
                   initResponse.headers.get("X-Goog-Upload-URL");
                   
  if (!uploadUrl) {
    console.error("[Gemini Upload] No upload URL in headers. Available headers:", 
      Array.from(initResponse.headers.keys())
    );
    throw new Error("No upload URL received from Gemini");
  }

  console.log("[Gemini Upload] Got upload URL:", uploadUrl);

  // Upload the file
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": buffer.length.toString(),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: buffer
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("[Gemini Upload] Upload response error:", {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      body: errorText
    });
    throw new Error(`Failed to upload file: ${uploadResponse.statusText} - ${errorText}`);
  }

  const fileInfo = await uploadResponse.json();
  console.log("[Gemini Upload] File upload response:", fileInfo);

  return fileInfo.file.uri;
}

export async function POST(request: Request) {
  try {
    console.log("[Gemini Upload] Starting file upload process");
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      console.log("[Gemini Upload] No file provided in request");
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("[Gemini Upload] File received:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Gemini
    const geminiFileUri = await uploadToGemini(file, buffer);
    console.log("[Gemini Upload] File uploaded to Gemini:", geminiFileUri);

    // Also save locally for reference
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filename = `${uuidv4()}-${file.name}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    console.log("[Gemini Upload] File saved locally at:", filepath);

    const response = { 
      uri: geminiFileUri,
      mimeType: file.type,
      filename: file.name
    };
    console.log("[Gemini Upload] Sending response:", response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("[Gemini Upload] File upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 }
    );
  }
} 