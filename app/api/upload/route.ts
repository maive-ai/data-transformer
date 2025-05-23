import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    // Check for ?template=1 in the URL
    const url = new URL(request.url);
    const isTemplate = url.searchParams.get('template') === '1';
    console.log('[UPLOAD] isTemplate:', isTemplate);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      console.log('[UPLOAD] No file provided');
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    console.log('[UPLOAD] File received:', file.name, file.size, file.type);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create target directory if it doesn't exist
    const targetDir = isTemplate
      ? join(process.cwd(), "public", "templates")
      : join(process.cwd(), "public", "uploads");
    console.log('[UPLOAD] Target directory:', targetDir);
    await mkdir(targetDir, { recursive: true });
    console.log('[UPLOAD] Directory ensured');

    // Create a unique filename
    const filename = `${uuidv4()}-${file.name}`;
    const filepath = join(targetDir, filename);
    console.log('[UPLOAD] File path:', filepath);

    // Save the file
    await writeFile(filepath, buffer);
    console.log('[UPLOAD] File written:', filepath);

    // Return the public URL
    const publicUrl = isTemplate
      ? `/templates/${filename}`
      : `/uploads/${filename}`;
    console.log('[UPLOAD] Returning URL:', publicUrl);
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("[UPLOAD] File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
} 