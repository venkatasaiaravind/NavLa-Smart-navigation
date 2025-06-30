import type { Product } from '../types/product';

// Mock Store Layout Matrix (String representation)
// Format: Comma-separated values, newline for rows.
// Cell content: Location ID, potentially with item category hint (e.g., "A1: Fruits") or special locations like "Entrance", "Checkout", "Empty".
export const storeLayoutMatrixString = `
Entrance,A1: Fruits,A2: Dairy,A3: Bakery
B1: Vegetables,Empty,Empty,A4: Meat
B2: Dairy,C1: Drinks,C2: Snacks,A5: Frozen
B3: Breakfast,C3: Toiletries,Checkout,Empty
`;

// Mock Product Data (Prices adjusted roughly for INR)
export const mockProductsData: Product[] = [
  { id: 'prod1', name: 'Organic Apples (1kg)', category: 'Fruits', price: 180, location: 'A1', keywords: 'apple fruit organic', stock: 120, discount: 0 },
  { id: 'prod2', name: 'Whole Milk (1L)', category: 'Dairy', price: 65, location: 'A2', keywords: 'milk dairy liter', stock: 45, discount: 0 },
  { id: 'prod3', name: 'Sourdough Bread (Loaf)', category: 'Bakery', price: 150, location: 'A3', keywords: 'bread bakery sourdough', stock: 60, discount: 0.05 }, // 5% discount
  { id: 'prod4', name: 'Chicken Breast (500g)', category: 'Meat', price: 250, location: 'A4', keywords: 'chicken meat poultry', stock: 30, discount: 0 },
  { id: 'prod5', name: 'Romaine Lettuce (Bunch)', category: 'Vegetables', price: 50, location: 'B1', keywords: 'lettuce vegetable salad', stock: 80, discount: 0 },
  { id: 'prod6', name: 'Greek Yogurt (150g)', category: 'Dairy', price: 45, location: 'B2', keywords: 'yogurt dairy greek', stock: 100, discount: 0 },
  { id: 'prod7', name: 'Corn Flakes Cereal (500g)', category: 'Breakfast', price: 190, location: 'B3', keywords: 'cereal breakfast cornflakes', stock: 70, discount: 0.1 }, // 10% discount
  { id: 'prod8', name: 'Cola (300ml Can)', category: 'Drinks', price: 35, location: 'C1', keywords: 'soda drink cola', stock: 150, discount: 0 },
  { id: 'prod9', name: 'Potato Chips (Large Bag)', category: 'Snacks', price: 50, location: 'C2', keywords: 'chips snacks potato', stock: 90, discount: 0 },
  { id: 'prod10', name: 'Herbal Shampoo (200ml)', category: 'Toiletries', price: 120, location: 'C3', keywords: 'shampoo toiletries hair', stock: 40, discount: 0 },
  { id: 'prod11', name: 'Orange Juice (1L)', category: 'Drinks', price: 110, location: 'C1', keywords: 'juice drink orange', stock: 55, discount: 0 },
  { id: 'prod12', name: 'Frozen Pizza (Medium)', category: 'Frozen', price: 280, location: 'A5', keywords: 'pizza frozen', stock: 25, discount: 0.15 }, // 15% discount
  { id: 'prod13', name: 'Bananas (Bunch)', category: 'Fruits', price: 50, location: 'A1', keywords: 'banana fruit', stock: 150, discount: 0 },
  { id: 'prod14', name: 'Cheddar Cheese (200g)', category: 'Dairy', price: 180, location: 'A2', keywords: 'cheese dairy cheddar', stock: 35, discount: 0 },
  { id: 'prod15', name: 'Toothpaste (100g)', category: 'Toiletries', price: 75, location: 'C3', keywords: 'toothpaste toiletries dental', stock: 65, discount: 0 },
  { id: 'prod16', name: 'Instant Noodles (Pack)', category: 'Snacks', price: 25, location: 'C2', keywords: 'noodles snacks instant', stock: 110, discount: 0 },
  { id: 'prod17', name: 'Whole Wheat Bread (Slice)', category: 'Bakery', price: 40, location: 'A3', keywords: 'bread bakery whole wheat', stock: 75, discount: 0 },
  { id: 'prod18', name: 'Spinach (Bunch)', category: 'Vegetables', price: 40, location: 'B1', keywords: 'spinach vegetable leafy green', stock: 50, discount: 0 },
  { id: 'prod19', name: 'Butter (100g)', category: 'Dairy', price: 55, location: 'B2', keywords: 'butter dairy', stock: 80, discount: 0 },
  { id: 'prod20', name: 'Oats (1kg)', category: 'Breakfast', price: 220, location: 'B3', keywords: 'oats breakfast healthy', stock: 60, discount: 0.05 }, // 5% discount
];


// Helper function to parse the matrix string into a 2D array
export const parseStoreLayout = (matrixString: string): string[][] => {
  return matrixString
    .trim()
    .split('\n')
    .map(row => row.split(',').map(cell => cell.trim()));
};

// Parsed layout for potential direct use
export const storeLayoutParsed = parseStoreLayout(storeLayoutMatrixString);

// You might add functions here to fetch/update this data from a real backend/database.
// e.g., export async function getProducts(): Promise<Product[]> { ... }
// e.g., export async function updateProduct(product: Product): Promise<void> { ... }
