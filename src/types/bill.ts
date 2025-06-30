import type { CartItem } from './cart';

export type Bill = {
  id: string;
  customerId: string; // Identifier for the customer
  date: Date;
  items: Pick<CartItem, 'id' | 'name' | 'price' | 'quantity'>[];
  totalAmount: number;
  // Potentially add payment status, method etc.
};
