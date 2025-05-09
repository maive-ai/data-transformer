import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const inputFile = formData.get("file") as File;
    const outputFile = formData.get("outputFile") as File;

    if (!inputFile || !outputFile) {
      return NextResponse.json(
        { error: "Both input and output files are required" },
        { status: 400 }
      );
    }

    // 1. Upload both files to Gemini
    const inputUpload = await uploadFileToGeminiResumable(inputFile, GEMINI_API_KEY);
    const outputUpload = await uploadFileToGeminiResumable(outputFile, GEMINI_API_KEY);

    // 2. Compose the prompt and reference the files
    const prompt = "Transform the input file to match the output file structure. Return ONLY the CSV data.";

    // 3. Prepare the contents array
    const contents = [
      {
        parts: [
          { text: prompt },
          { file_data: { mime_type: inputUpload.mimeType, file_uri: inputUpload.uri } },
          { file_data: { mime_type: outputUpload.mimeType, file_uri: outputUpload.uri } }
        ]
      }
    ];

    // 4. Call Gemini generateContent
    const genRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );
    const genData = await genRes.json();

    // 5. Extract CSV from response
    let csvContent = "";
    if (genData.candidates?.[0]?.content?.parts) {
      for (const part of genData.candidates[0].content.parts) {
        if (part.text && part.text.includes(",")) {
          csvContent = part.text;
          break;
        }
      }
    }

    return NextResponse.json({
      csvContent,
      markdown: "CSV file has been generated successfully."
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to process file with Gemini" },
      { status: 500 }
    );
  }
}

// Place the uploadFileToGemini helper here as well
async function uploadFileToGeminiResumable(file: File, apiKey: string) {
  // 1. Start resumable upload (send metadata)
  const metadataRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(file.size),
        "X-Goog-Upload-Header-Content-Type": file.type || "application/octet-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: file.name } }),
    }
  );
  const uploadUrl = metadataRes.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) throw new Error("No upload URL returned from Gemini");

  // 2. Upload the actual bytes
  const bytesRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(file.size),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: await file.arrayBuffer(),
  });
  if (!bytesRes.ok) {
    const errorText = await bytesRes.text();
    console.error("Gemini file upload error:", errorText);
    throw new Error("Failed to upload file bytes to Gemini");
  }
  const data = await bytesRes.json();
  return { uri: data.file.uri, mimeType: data.file.mimeType };
} 