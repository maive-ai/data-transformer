import { NextResponse } from "next/server";
import { searchBomComponents } from "@/lib/nexar-demo";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const bomFile = formData.get('bomFile') as File;
    
    if (!bomFile) {
      return NextResponse.json({ error: 'No BOM file provided' }, { status: 400 });
    }
    
    // Read the BOM CSV content
    const bomContent = await bomFile.text();
    
    // Process the BOM using existing Nexar client
    const enhancedBomContent = await searchBomComponents(bomContent);
    
    return NextResponse.json({
      success: true,
      csvData: enhancedBomContent
    });
    
  } catch (error) {
    console.error('Nexar search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search components' },
      { status: 500 }
    );
  }
} 