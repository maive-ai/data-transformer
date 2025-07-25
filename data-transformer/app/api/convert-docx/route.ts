import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { extractTextFromDocx } from "@/lib/docx-converter";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Check if it's a docx file
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return NextResponse.json(
        { error: "File must be a .docx file" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create temp directory
    const tempDir = join(process.cwd(), "temp");
    await mkdir(tempDir, { recursive: true });

    // Save uploaded docx file
    const docxFilename = `${uuidv4()}-${file.name}`;
    const docxPath = join(tempDir, docxFilename);
    await writeFile(docxPath, buffer);

    // Extract text from DOCX
    const textContent = await extractTextFromDocx(docxPath);
    
    // Create a text file with the extracted content
    const textFilename = docxFilename.replace('.docx', '.txt');
    const textFile = new File([textContent], textFilename, { type: 'text/plain' });

    // Create response
    const response = new NextResponse(textFile);
    response.headers.set('Content-Type', 'text/plain');
    response.headers.set('Content-Disposition', `attachment; filename="${textFilename}"`);
    
    return response;
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "Failed to convert file" },
      { status: 500 }
    );
  }
} 