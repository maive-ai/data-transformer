import 'dotenv/config';
import { NexarClient } from './nexar-client';

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
    supSearch(q: $mpn, limit: 3) {
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

// Helper function to extract Nexar data from search results
function extractNexarData(part: Part): string {
  let bestPrice = '';
  let bestCurrency = '';
  let bestAvailability = '';
  let leadTime = '';
  let obsolescence = 'Active';
  let alternatives = '';
  let sellers = '';
  
  if (part.sellers && part.sellers.length > 0) {
    const seller = part.sellers[0];
    if (seller.offers && seller.offers.length > 0) {
      const offer = seller.offers[0];
      if (offer.prices && offer.prices.length > 0) {
        const price = offer.prices[0];
        bestPrice = price.price.toString();
        bestCurrency = price.currency;
      }
      bestAvailability = offer.inventoryLevel;
    }
    sellers = part.sellers.map(s => s.company.name).join('; ');
  }
  
  // Check for alternatives (generic MPN)
  if (part.genericMpn && part.genericMpn !== part.mpn) {
    alternatives = part.genericMpn;
  }
  
  return `${bestPrice},${bestCurrency},${bestAvailability},${leadTime},${obsolescence},${alternatives},"${sellers}"`;
}

// Helper function to process a single BOM row
async function processBomRow(line: string, mpnColumnIndex: number): Promise<string> {
  const parts = line.split(',').map(part => part.trim());
  const mpn = parts[mpnColumnIndex] || '';
  
  if (!mpn) {
    // If no MPN, keep original row with empty Nexar data
    return line + ',,,,,,,';
  }
  
  try {
    // Search for this MPN
    const response = await nexar.query<SearchResponse>(gqlQuery, { mpn });
    const results = response?.data?.supSearch?.results;
    
    if (results && results.length > 0) {
      const part = results[0].part; // Use first result
      const nexarData = extractNexarData(part);
      return line + ',' + nexarData;
    } else {
      // No results found, keep original row with empty Nexar data
      return line + ',,,,,,,';
    }
    
  } catch (error) {
    console.error(`Error searching for MPN ${mpn}:`, error);
    // Keep original row with empty Nexar data
    return line + ',,,,,,,';
  }
}

// New function for BOM processing
export async function searchBomComponents(bomCsvContent: string): Promise<string> {
  try {
    // Parse CSV content
    const lines = bomCsvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have at least one data row');
    
    const header = lines[0];
    const dataLines = lines.slice(1);
    
    // Find MPN column index
    const mpnColumnIndex = findMpnColumnIndex(header);
    
    // Add new columns for Nexar data
    const enhancedHeader = header + ',nexar_price,nexar_currency,nexar_availability,nexar_lead_time,nexar_obsolescence,nexar_alternatives,nexar_sellers';
    
    // Process each BOM row
    const enhancedRows = await Promise.all(
      dataLines.map(line => processBomRow(line, mpnColumnIndex))
    );
    
    // Return enhanced CSV
    return [enhancedHeader, ...enhancedRows].join('\n');
    
  } catch (error) {
    console.error('Error processing BOM:', error);
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