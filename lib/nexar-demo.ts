import 'dotenv/config';
import { NexarClient } from './nexar-client';
import { Readable } from 'stream';
import * as fs from 'fs/promises';
import * as path from 'path';

// Use require for csv-parser to avoid TypeScript issues
const csvParser = require('csv-parser');

// Environment variable validation
const clientId = process.env.NEXAR_CLIENT_ID ?? (() => {
  throw new Error("Please set environment variable 'NEXAR_CLIENT_ID'");
})();

const clientSecret = process.env.NEXAR_CLIENT_SECRET ?? (() => {
  throw new Error("Please set environment variable 'NEXAR_CLIENT_SECRET'");
})();

// Initialize Nexar client
const nexar = new NexarClient(clientId, clientSecret);

// GraphQL query for searching parts by MPN
const gqlQuery = `query Search($mpn: String!) {
    supSearch(q: $mpn, limit: 1) {
        results {
            part {
                mpn
                genericMpn
                shortDescription
                manufacturer {
                    name
                }
                sellers(includeBrokers: true) {
                    company {
                        name
                    }
                    offers {
                        clickUrl
                        inventoryLevel
                        prices{
                            price
                            currency
                            quantity
                        }
                    }
                }
            }
        }
    }
}`;

// Types for the response
interface Price {
  price: number;
  currency: string;
  quantity: number;
}

interface Offer {
  clickUrl: string;
  inventoryLevel: string;
  prices: Price[];
}

interface Seller {
  company: {
    name: string;
  };
  offers: Offer[];
}

interface Part {
  mpn: string;
  genericMpn: string;
  shortDescription: string;
  manufacturer: {
    name: string;
  };
  sellers: Seller[];
}

interface SearchResult {
  part: Part;
}

interface SearchResponse {
  supSearch: {
    results: SearchResult[];
  };
}

// // Helper function to get lifecycle status
// function getLifecycleStatus(specs: PartSpec[]): string {
//   const spec = specs.find(
//     (x) => x?.attribute?.shortname === "lifecyclestatus"
//   );
//   return spec?.value ?? "";
// }

// Main search function
export async function searchPartByMPN(mpn: string): Promise<void> {
  try {
    // Run the query
    const response = await nexar.query<SearchResponse>(gqlQuery, { mpn });
    const results = response?.data?.supSearch?.results;

    // Check if no results
    if (!results || results.length === 0) {
      console.log("Sorry, no parts found");
      console.log();
      return;
    }

    // Print the results
    for (const result of results) {
      const part = result.part;
      console.log(`MPN: ${part.mpn}`);
      console.log(`Generic MPN: ${part.genericMpn}`);
      console.log(`Description: ${part.shortDescription}`);
      console.log(`Manufacturer: ${part.manufacturer.name}`);
      console.log(`Sellers:`);
      
      for (const seller of part.sellers) {
        console.log(`  ${seller.company.name}:`);
        
        for (const offer of seller.offers) {
          console.log(`    Offer: ${offer.clickUrl}`);
          console.log(`    Inventory: ${offer.inventoryLevel}`);
          console.log(`    Prices:`);
          
          for (const price of offer.prices) {
            console.log(`      ${price.price} ${price.currency} per ${price.quantity}`);
          }
          console.log();
        }
      }
      console.log('─'.repeat(50));
    }
  } catch (error) {
    console.error('Error searching for part:', error);
  }
}

// Helper function to find MPN column index
function findMpnColumnIndex(header: string): number {
  const headerColumns = header.split(',').map(col => col.trim().toLowerCase());
  const mpnColumnIndex = headerColumns.findIndex(col => 
    col === 'mpn' || 
    col === 'manufacturer part number' || 
    col === 'part number' || 
    col === 'partnumber' ||
    col === 'manufacturerpartnumber'
  );
  
  if (mpnColumnIndex === -1) {
    throw new Error('No MPN column found in BOM. Expected column names: mpn, manufacturer part number, part number, partnumber, manufacturerpartnumber');
  }
  
  return mpnColumnIndex;
}



// Refactored helper function to process a single BOM row (JSON version)
async function processBomRow(row: Record<string, any>, mpnColumnIndex: number): Promise<Record<string, any>> {
  const mpn = Object.values(row)[mpnColumnIndex] as string || '';
  let nexarData: any = null;

  if (mpn) {
    try {
      // Search for this MPN
      const response = await nexar.query<SearchResponse>(gqlQuery, { mpn });
      const results = response?.data?.supSearch?.results;
      if (results && results.length > 0) {
        const part = results[0].part; // Use first result
        nexarData = part;
      }
    } catch (error) {
      console.error(`Error searching for MPN ${mpn}:`, error);
    }
  }
  
  // Build enriched object with nested nexarData
  const enriched: Record<string, any> = { ...row };
  enriched.nexarData = nexarData;
  
  return enriched;
}

// Helper function to parse CSV to JSON
export async function parseCsvToJson(csvContent: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const stream = Readable.from(csvContent);
    
    stream
      .pipe(csvParser())
      .on('data', (data: any) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error: any) => reject(error));
  });
}

// Helper function to log enriched BOM data to file
async function logEnrichedBomToFile(enrichedData: any[], outputPath?: string): Promise<string> {
  try {
    // Default output path in the data directory
    const defaultPath = path.join(process.cwd(), 'data', 'enriched_bom.json');
    const filePath = outputPath || defaultPath;
    
    // Ensure the directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Convert to JSON string with pretty formatting
    const jsonContent = JSON.stringify(enrichedData, null, 2);
    
    // Write to file (this will overwrite the file each time)
    await fs.writeFile(filePath, jsonContent, 'utf8');
    
    console.log(`✅ [NEXAR] Enriched BOM data logged to: ${filePath}`);
    console.log(`📊 [NEXAR] Logged ${enrichedData.length} enriched rows`);
    
    return filePath;
  } catch (error) {
    console.error('❌ [NEXAR] Error logging enriched BOM to file:', error);
    throw error;
  }
}

// New function for BOM processing
export async function searchBomComponents(bomCsvContent: string, logToFile: boolean = true): Promise<any[]> {
  try {
    // Parse CSV to JSON first
    const bomData = await parseCsvToJson(bomCsvContent);
    
    if (bomData.length === 0) {
      throw new Error('No data found in CSV');
    }
    
    // Get headers from the first row
    const headers = Object.keys(bomData[0]);
    
    // Find MPN column index
    const mpnColumnIndex = findMpnColumnIndex(headers.join(','));
    
    console.log(`🔍 [NEXAR] Processing ${bomData.length} BOM rows with MPN column at index ${mpnColumnIndex}`);
    
    // Process each BOM row using the refactored processBomRow
    const enrichedRows = await Promise.all(
      bomData.map(row => processBomRow(row, mpnColumnIndex))
    );
    
    // Log to file if requested
    if (logToFile) {
      await logEnrichedBomToFile(enrichedRows);
    }
    
    console.log(`✅ [NEXAR] Successfully processed ${enrichedRows.length} BOM rows`);
    
    return enrichedRows;
    
  } catch (error) {
    console.error('❌ [NEXAR] Error processing BOM:', error);
    throw error;
  }
}

// Interactive CLI version (for Node.js environments)
export async function startInteractiveSearch(): Promise<void> {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Search MPN: ",
  });

  rl.on("line", async (mpn: string) => {
    if (!mpn.length) {
      rl.close();
      return;
    }

    await searchPartByMPN(mpn);
    rl.prompt();
  });

  rl.prompt();
}

// Example usage function
export async function exampleUsage(): Promise<void> {
  console.log('Searching for example part...');
  await searchPartByMPN('CRG0603F10K');
}

// Export the client for direct use
export { nexar }; 