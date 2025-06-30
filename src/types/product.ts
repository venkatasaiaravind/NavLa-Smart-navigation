export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  location: string; // Aisle or section identifier
  keywords?: string; // For image search hint
  stock?: number; // Optional: for admin side
  discount?: number; // Optional: discount percentage (e.g., 0.1 for 10%)
};
