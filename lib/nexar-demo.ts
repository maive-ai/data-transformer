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