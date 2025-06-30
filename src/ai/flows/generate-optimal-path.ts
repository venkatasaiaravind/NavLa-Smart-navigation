'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate the optimal sequence of key locations
 * (Entrance, item locations, Checkout) for a shopping trip based on a cart and store layout.
 *
 * - generateOptimalPath - A function that takes a cart and store layout as input and returns the optimal sequence.
 * - GenerateOptimalPathInput - The input type for the generateOptimalPath function.
 * - GenerateOptimalPathOutput - The return type for the generateOptimalPath function.
 */

import {ai} from '../ai-instance';
import {z} from 'genkit';

const GenerateOptimalPathInputSchema = z.object({
  cartItems: z
    .array(z.string())
    .describe(
      'An array of item descriptions in the cart, each MUST include its location coordinate (e.g., "Item Name (at A1)").'
    ),
  storeLayout: z
    .string()
    .describe(
      'A 2D grid representation of the store layout as a string. Rows are separated by newlines, columns by commas. Cells contain location IDs (e.g., "A1"), item category hints ("A1: Fruits"), special locations ("Entrance", "Checkout"), or "Empty". Represents aisles and shelf coordinates.'
    ),
});

export type GenerateOptimalPathInput = z.infer<typeof GenerateOptimalPathInputSchema>;

const GenerateOptimalPathOutputSchema = z.object({
  optimalPath: z
    .array(z.string())
    .describe('An array of **key location coordinates** (e.g., "Entrance", "A1", "C3", "Checkout") representing the optimal *sequence* of locations to visit to collect all items. The sequence MUST start at "Entrance" and end at "Checkout". It should represent the most efficient order to visit the necessary locations.'),
});

export type GenerateOptimalPathOutput = z.infer<typeof GenerateOptimalPathOutputSchema>;

// Helper function to parse the matrix string into a 2D array
const parseStoreLayout = (matrixString: string): string[][] => {
  if (!matrixString || typeof matrixString !== 'string') {
      console.error("Invalid store layout string provided.");
      return []; // Return empty array if input is invalid
  }
  return matrixString
    .trim()
    .split('\n')
    .map(row => row.split(',').map(cell => cell.trim()));
};


export async function generateOptimalPath(
  input: GenerateOptimalPathInput
): Promise<GenerateOptimalPathOutput> {
  return generateOptimalPathFlow(input);
}

// Helper to get location ID from cell content
const getLocationId = (cellContent: string): string => {
    if (!cellContent) return 'Unknown';
    const match = cellContent.match(/^[A-Z]+\d+/);
    if (match) return match[0];
    if (cellContent === "Entrance" || cellContent === "Checkout") return cellContent;
    return cellContent.split(':')[0] || cellContent || 'Unknown';
};


const prompt = ai.definePrompt({
  name: 'generateOptimalPathPrompt',
  input: {
    schema: z.object({
      cartItems: z
        .array(z.string())
        .describe(
          'An array of item descriptions in the cart, each MUST include its location coordinate (e.g., "Item Name (at A1)").'
        ),
      storeLayout: z
        .string()
        .describe(
          'A 2D grid representation of the store layout as a string. Rows are separated by newlines, columns by commas. Cells contain location IDs (e.g., "A1"), item category hints ("A1: Fruits"), special locations ("Entrance", "Checkout"), or "Empty". This represents aisles and shelf coordinates. Travel is only allowed between adjacent non-"Empty" cells (horizontally or vertically).'
        ),
    }),
  },
  output: {
    schema: z.object({
      optimalPath: z
        .array(z.string())
        .describe('An array of **key location coordinates** (e.g., "Entrance", "A1", "C3", "Checkout") representing the optimal *sequence* of locations to visit to collect all items. The sequence MUST start at "Entrance", end at "Checkout", and include all unique item locations from the cart in the most efficient order. Do NOT include every single grid step, only the sequence of important locations.'),
    }),
  },
  prompt: `You are an expert shopping route optimizer for a store represented by a 2D grid (aisles and shelves). Your task is to calculate the most efficient *sequence of key locations* for a shopper to collect all items in their cart, starting from the 'Entrance' location and ending at the 'Checkout' location.

You are given:
1.  **Cart Items:** A list of items the shopper needs to collect. Each item **includes its known location coordinate** (e.g., "Organic Apples (at A1)").
2.  **Store Layout:** A 2D grid representation of the store layout provided as a string. Each cell in the grid represents a physical location identified by a coordinate (e.g., 'A1', 'B3'). Cells can contain item categories, special locations ('Entrance', 'Checkout'), or 'Empty'.

**Store Layout Matrix (Grid Coordinates and Contents):**
{{{storeLayout}}}

**Cart Items (Coordinates are provided):**
{{#each cartItems}}
- {{{this}}}
{{/each}}

**Instructions:**
1.  **Identify Target Locations:** Extract the unique set of target location coordinates (e.g., A1, B3) for all items listed in the cart from the "(at ...)" part of the item descriptions.
2.  **Determine Optimal Sequence:** Calculate the shortest path *sequence* that starts at 'Entrance', visits *all* unique target item location nodes, and ends at 'Checkout'. The sequence should represent the order in which the shopper should visit these key locations to minimize total travel distance on the grid (implicitly considering travel between adjacent non-'Empty' cells).
3.  **Output Key Locations Sequence ONLY:** The final output **must** be a single array containing only the sequence of *key location coordinates* visited, in order. For example: ["Entrance", "A1", "C3", "B1", "Checkout"]. **DO NOT** output every single grid cell the shopper steps on. Only list the main locations (Entrance, item locations, Checkout) in the optimal visiting order.
4.  **Start and End:** Ensure 'Entrance' is the first element and 'Checkout' is the last element in the output array.
5.  **Include All Items:** The sequence must include all unique locations where items need to be picked up.
6.  **Return Format:** Provide the calculated optimal sequence strictly as a single array of location coordinate strings.
`,
});


const generateOptimalPathFlow = ai.defineFlow<
  typeof GenerateOptimalPathInputSchema,
  typeof GenerateOptimalPathOutputSchema
>(
  {
    name: 'generateOptimalPathFlow',
    inputSchema: GenerateOptimalPathInputSchema,
    outputSchema: GenerateOptimalPathOutputSchema,
  },
  async input => {
    // Parse the layout once for validation
    const parsedLayout = parseStoreLayout(input.storeLayout);

    // --- Pre-validation of Input ---
    if (!Array.isArray(parsedLayout) || parsedLayout.length === 0 || !Array.isArray(parsedLayout[0])) {
        console.error("Invalid store layout provided to flow. Cannot generate path.");
        return { optimalPath: ['Entrance', 'Checkout'] }; // Minimal fallback
    }
    const validLocations = new Set(parsedLayout.flat().map(getLocationId).filter(loc => loc !== 'Empty' && loc !== 'Unknown'));
    if (!validLocations.has('Entrance') || !validLocations.has('Checkout')) {
        console.error("Store layout must contain 'Entrance' and 'Checkout'.");
         return { optimalPath: ['Entrance', 'Checkout'] }; // Minimal fallback
    }
     const itemLocations = input.cartItems
            .map(itemStr => {
                const match = itemStr.match(/\(at\s+([A-Z]+\d+|Entrance|Checkout)\)/);
                return match ? match[1] : null;
            })
            .filter((loc): loc is string => loc !== null);

     const uniqueItemLocations = new Set(itemLocations);

     const invalidItemLocations = itemLocations.filter(loc => !validLocations.has(loc));
     if (invalidItemLocations.length > 0) {
         console.error(`Cart contains items with invalid locations not in the layout: ${invalidItemLocations.join(', ')}`);
         // Proceeding, but AI might ignore these or produce less optimal results.
     }
    // --- End Pre-validation ---


    const {output} = await prompt(input);

    // --- AI Output Processing & Basic Validation ---
    if (!output || !output.optimalPath || !Array.isArray(output.optimalPath) || output.optimalPath.length < 2) { // Need at least Entrance and Checkout
        console.error("AI failed to generate a valid path sequence or returned empty/too short. Applying fallback.");
        // Fallback: Simple ordered path: Entrance -> All Item Locations -> Checkout
        const fallbackPath = ['Entrance', ...Array.from(uniqueItemLocations).filter(loc => loc !== 'Entrance' && loc !== 'Checkout'), 'Checkout'];
        // Simple deduplication
        const finalFallbackPath = fallbackPath.reduce((acc, curr) => {
            if (!acc.includes(curr)) {
                acc.push(curr);
            }
            return acc;
        }, [] as string[]);
        console.log("Using fallback path:", finalFallbackPath);
        return { optimalPath: finalFallbackPath };
    }

     let path = output.optimalPath;
     console.log("Raw AI Path Sequence:", path);

     // 1. Filter out any 'Empty' or invalid locations immediately (though AI should avoid this now)
     path = path.filter(loc => validLocations.has(loc));

     // 2. Ensure Entrance is first and Checkout is last (force if needed)
     if (path.length === 0 || path[0] !== 'Entrance') {
         console.warn("AI path sequence didn't start with Entrance. Fixing.");
        path = ['Entrance', ...path.filter(loc => loc !== 'Entrance')];
     }
     if (path.length === 0) { // If filtering made it empty
         path = ['Entrance'];
     }
     if (path[path.length - 1] !== 'Checkout') {
          console.warn("AI path sequence didn't end with Checkout. Fixing.");
         path = [...path.filter(loc => loc !== 'Checkout'), 'Checkout'];
     }

     // 3. Basic deduplication
     const uniquePath: string[] = [];
     path.forEach(loc => {
         if (uniquePath.length === 0 || uniquePath[uniquePath.length - 1] !== loc) {
             uniquePath.push(loc);
         }
     });


     // 4. Ensure all required item locations are visited (simple check)
     const finalPathSet = new Set(uniquePath);
     const requiredItemLocations = new Set(itemLocations.filter(loc => loc !== 'Entrance' && loc !== 'Checkout' && validLocations.has(loc))); // Only check valid ones
     const missingLocations = [...requiredItemLocations].filter(loc => !finalPathSet.has(loc));

     if (missingLocations.length > 0) {
         console.warn(`Final path sequence is missing required item locations: ${missingLocations.join(', ')}. Inserting before Checkout.`);
         // Simple Strategy: Insert missing items just before Checkout
         const checkoutIndex = uniquePath.lastIndexOf('Checkout');
         if (checkoutIndex !== -1) {
              uniquePath.splice(checkoutIndex, 0, ...missingLocations);
               // Re-deduplicate after insertion
               const cleanedPathAfterInsertion: string[] = [];
               uniquePath.forEach(loc => {
                   if (cleanedPathAfterInsertion.length === 0 || cleanedPathAfterInsertion[cleanedPathAfterInsertion.length - 1] !== loc) {
                       cleanedPathAfterInsertion.push(loc);
                   }
               });
               console.log("Path after inserting missing and cleaning:", cleanedPathAfterInsertion);
               return { optimalPath: cleanedPathAfterInsertion };
         } else {
             console.error("Checkout index not found after validation, cannot reliably insert missing items. Appending.");
             uniquePath.push(...missingLocations);
             if (!uniquePath.includes('Checkout')) uniquePath.push('Checkout'); // Ensure checkout is still last
             // Deduplicate last part
             const finalFallbackPath = uniquePath.reduce((acc, curr) => {
                if (!acc.includes(curr)) {
                   acc.push(curr);
                }
                return acc;
              }, [] as string[]);
             return { optimalPath: finalFallbackPath };
         }
     }


    console.log("Final validated path sequence:", uniquePath);
    return { optimalPath: uniquePath };
    // --- End AI Output Processing ---
  }
);
