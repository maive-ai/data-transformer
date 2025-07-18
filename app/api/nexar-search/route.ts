import { NextResponse } from "next/server";
import { searchMultipleBomComponents } from "@/lib/nexar-demo";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const bomFiles = formData.getAll("bomFile") as File[]; // Get all files
    const approvedSuppliers = formData.get("approvedSuppliers") as string | null;

    if (!bomFiles || bomFiles.length === 0) {
      return NextResponse.json(
        { error: "No BOM file(s) provided" },
        { status: 400 }
      );
    }

    const parsedApprovedSuppliers: string[] = approvedSuppliers ? JSON.parse(approvedSuppliers) : [];

    // Convert File objects to the expected format for searchMultipleBomComponents
    const bomFilesToProcess = await Promise.all(bomFiles.map(async (file) => ({
      filename: file.name,
      content: await file.text(),
    })));

    // Use the new function to search multiple BOM components
    const results = await searchMultipleBomComponents(bomFilesToProcess, parsedApprovedSuppliers);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("[NEXAR API] Error processing BOM file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process BOM file" },
      { status: 500 }
    );
  }
} 