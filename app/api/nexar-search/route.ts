import { NextResponse } from "next/server";
import { searchBomComponents} from "@/lib/nexar-demo";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const bomFile = formData.get('bomFile') as File;
    const approvedSuppliersRaw = formData.get('approvedSuppliers');
    
    if (!bomFile) {
      return NextResponse.json({ error: 'No BOM file provided' }, { status: 400 });
    }
    
    // Parse approvedSuppliers from JSON string, fallback to default
    let approvedSuppliers: string[] = [];
    if (approvedSuppliersRaw && typeof approvedSuppliersRaw === 'string') {
      try {
        approvedSuppliers = JSON.parse(approvedSuppliersRaw);
      } catch (e) {
        console.warn('Failed to parse approvedSuppliers, using default');
      }
    }
    
    // Read the BOM CSV content
    const bomContent = await bomFile.text();
    // Process the BOM using existing Nexar client
    const enrichedBomData = await searchBomComponents(bomContent, approvedSuppliers);
    return NextResponse.json({
      success: true,
      data: enrichedBomData
    });
  } catch (error) {
    console.error('Nexar search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search components' },
      { status: 500 }
    );
  }
} 