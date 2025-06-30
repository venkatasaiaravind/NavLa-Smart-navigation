'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  // SidebarMenuItem, // No longer needed directly
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateOptimalPath, type GenerateOptimalPathInput, type GenerateOptimalPathOutput } from '@/ai/flows/generate-optimal-path';
import { ShoppingCart, MapPinned, CheckCircle, Trash2, Plus, Minus, X, Loader2, Home, Search as SearchIcon, Eye } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { mockProductsData, storeLayoutMatrixString, storeLayoutParsed } from '@/lib/store-data';
import type { Product } from '@/types/product';
import type { CartItem } from '@/types/cart';
import { Skeleton } from '@/components/ui/skeleton';
import { OptimalPathModal } from '@/components/optimal-path-modal'; // Import the new modal component

// Helper function to format currency in INR
const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};


export default function UserPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [optimalPath, setOptimalPath] = useState<string[] | null>(null); // Now stores the sequence of key locations
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [currentPathIndex, setCurrentPathIndex] = useState(0); // Index in the optimalPath sequence
  const [isPathModalOpen, setIsPathModalOpen] = useState(false); // State for modal visibility


  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return mockProductsData;
    return mockProductsData.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.keywords?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

   const showToast = useCallback((options: Parameters<typeof toast>[0]) => {
     // Ensure toast is only called client-side and outside render cycle
     if (typeof window !== 'undefined') {
        setTimeout(() => {
            toast(options);
        }, 0);
      }
  }, [toast]);


  const addToCart = useCallback((product: Product) => {
      setCart(prevCart => {
          const existingItem = prevCart.find(item => item.id === product.id);
          let updatedCart = prevCart;
          let showAddedToast = false;

          if (existingItem) {
              if (product.stock !== undefined && existingItem.quantity >= product.stock) {
                   showToast({
                       title: "Stock Limit Reached",
                       description: `Cannot add more ${product.name}. Only ${product.stock} available.`,
                       variant: "destructive",
                   });
                   return prevCart;
              }
              showAddedToast = true;
              updatedCart = prevCart.map(item =>
                  item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
              );
          } else {
              if (product.stock !== undefined && product.stock <= 0) {
                   showToast({
                       title: "Out of Stock",
                       description: `${product.name} is currently out of stock.`,
                       variant: "destructive",
                   });
                   return prevCart;
              }
              showAddedToast = true;
              updatedCart = [...prevCart, { ...product, quantity: 1 }];
          }

          if (showAddedToast) {
              showToast({
                  title: "Item Added",
                  description: `${product.name} added to cart.`,
                  className: "border-accent bg-accent/10 text-foreground",
              });
          }
          // Reset path if cart changes
          setOptimalPath(null);
          setCurrentPathIndex(0);
          setIsPathModalOpen(false); // Close modal if cart changes
          return updatedCart;
      });
  }, [showToast]);


  const removeFromCart = useCallback((productId: string) => {
      let removedItemName: string | undefined;
      setCart(prevCart => {
          const removedItem = prevCart.find(item => item.id === productId);
          if (removedItem) {
              removedItemName = removedItem.name;
          }
          const newCart = prevCart.filter(item => item.id !== productId);

          if (removedItemName) {
               showToast({
                   title: "Item Removed",
                   description: `${removedItemName} removed from cart.`,
                   variant: "destructive",
               });
          }
          // Reset path if cart changes
          setOptimalPath(null);
          setCurrentPathIndex(0);
          setIsPathModalOpen(false); // Close modal if cart changes
          return newCart;
      });
  }, [showToast]);


 const updateQuantity = useCallback((productId: string, quantity: number) => {
     const product = mockProductsData.find(p => p.id === productId);

     if (product && product.stock !== undefined && quantity > product.stock) {
         showToast({
             title: "Stock Limit Reached",
             description: `Cannot set quantity of ${product.name} to ${quantity}. Only ${product.stock} available.`,
             variant: "destructive",
         });
         return;
     }

     let originalItemName: string | undefined;
     let itemRemoved = false;

     setCart(prevCart => {
         const originalItem = prevCart.find(item => item.id === productId);
         if (originalItem) {
             originalItemName = originalItem.name;
         }

         const updatedCart = prevCart
             .map(item => (item.id === productId ? { ...item, quantity } : item))
             .filter(item => item.quantity > 0);

         if (originalItem && !updatedCart.some(item => item.id === productId)) {
             itemRemoved = true;
         }

         if (itemRemoved && originalItemName) {
              showToast({
                  title: "Item Removed",
                  description: `${originalItemName} removed from cart.`,
                  variant: "destructive",
              });
         }
          // Reset path if cart changes
          setOptimalPath(null);
          setCurrentPathIndex(0);
          setIsPathModalOpen(false); // Close modal if cart changes
         return updatedCart;
     });
 }, [showToast]);


  const totalCartItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const totalCartPrice = useMemo(() => {
    return cart.reduce((sum, item) => {
        const priceAfterDiscount = item.price * (1 - (item.discount || 0));
        return sum + priceAfterDiscount * item.quantity;
    }, 0);
  }, [cart]);


  // Removed getLocationId and productLocationsMap as they are not directly used here anymore
  // const getLocationId = ...
  // const productLocationsMap = ...

  const cartItemLocations = useMemo(() => {
      return new Set(cart.map(item => item.location));
  }, [cart]);


 const handleGeneratePath = async () => {
    if (cart.length === 0) {
      showToast({
        title: "Cart Empty",
        description: "Add items to your cart to generate an optimal path sequence.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingPath(true);
    setOptimalPath(null);
    setCurrentPathIndex(0);
    setIsPathModalOpen(false); // Ensure modal is closed initially

    try {
        const cartItemsWithLocations = cart.map(item => ({
          name: item.name,
          location: item.location
        }));

        const input: GenerateOptimalPathInput = {
          cartItems: cartItemsWithLocations.map(item => `${item.name} (at ${item.location})`),
          storeLayout: storeLayoutMatrixString,
        };

      console.log("Generating path sequence with input:", input);
      const result: GenerateOptimalPathOutput = await generateOptimalPath(input);
      console.log("AI raw output sequence:", result);

      let aiPathSequence = result.optimalPath;

       if (!Array.isArray(aiPathSequence) || aiPathSequence.length < 2) { // Should have at least Entrance and Checkout
          console.error("AI returned invalid or empty path sequence:", aiPathSequence);
          throw new Error("AI failed to generate a valid path sequence.");
       }

        // --- Path Validation (Simplified) ---
        // Basic checks: Starts with Entrance, Ends with Checkout, includes item locations
        const finalPathSet = new Set(aiPathSequence);
        const requiredLocations = new Set(cart.map(item => item.location).filter(loc => loc !== 'Entrance' && loc !== 'Checkout'));
        const missingLocations = [...requiredLocations].filter(loc => !finalPathSet.has(loc));

        if (aiPathSequence[0] !== 'Entrance') {
            console.warn("AI sequence didn't start with Entrance. Prepending.");
            aiPathSequence.unshift('Entrance');
        }
        if (aiPathSequence[aiPathSequence.length - 1] !== 'Checkout') {
             console.warn("AI sequence didn't end with Checkout. Appending.");
            aiPathSequence.push('Checkout');
        }
        if (missingLocations.length > 0) {
            // This case should ideally be handled better by the AI based on the updated prompt,
            // but we log a warning if it happens. The flow now also tries to insert them.
             console.warn(`AI sequence might be missing required item locations: ${missingLocations.join(', ')}.`);
        }

        // Deduplicate just in case
         const uniquePathSequence: string[] = [];
         aiPathSequence.forEach(loc => {
             if (uniquePathSequence.length === 0 || uniquePathSequence[uniquePathSequence.length - 1] !== loc) {
                 uniquePathSequence.push(loc);
             }
         });


        console.log("Final validated path sequence:", uniquePathSequence);
        // --- End Path Validation ---

      setOptimalPath(uniquePathSequence); // Store the sequence directly
      setCurrentPathIndex(0); // Start at the beginning of the new sequence
      setIsPathModalOpen(true); // Open the modal once path is generated
      showToast({
        title: "Optimal Path Sequence Generated!",
        description: "Click 'View Path' to see the sequence and map.",
        className: "border-primary bg-primary/10 text-foreground",
      });
    } catch (error) {
      console.error("Error generating optimal path sequence:", error);
      showToast({
        title: "Error Generating Path",
        description: `Could not generate the optimal path sequence. ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive",
      });
      setOptimalPath(null);
    } finally {
      setIsGeneratingPath(false);
    }
  };

  // Removed adjacency check and BFS functions as they are no longer needed on the client
  // const getCoords = ...
  // const areAdjacent = ...
  // const findShortestPathBFS = ...


  const handleCheckout = () => {
    if (cart.length === 0) {
         showToast({
            title: "Cart Empty",
            description: "Your cart is empty. Add items before checking out.",
            variant: "destructive",
         });
         return;
    }
     // Check if the *current location* in the sequence is 'Checkout'
     if (optimalPath && optimalPath[currentPathIndex] !== 'Checkout') {
        showToast({
            title: "Not at Checkout Location",
            description: "Please proceed to the Checkout location in the sequence before checking out.",
            variant: "destructive",
        });
        return;
     }
     // If no path generated yet, allow checkout (assume they walked manually)
      if (!optimalPath) {
          console.log("Checking out without a generated path.");
      }


    setIsCheckingOut(true);
    console.log("Checking out with items:", cart, "Total:", totalCartPrice);
    // Simulate backend call for checkout
    setTimeout(() => {
      setIsCheckingOut(false);
      setCheckoutComplete(true);
      setCart([]);
      setOptimalPath(null);
      setCurrentPathIndex(0);
      setIsPathModalOpen(false); // Close modal on successful checkout
       showToast({
          title: "Checkout Successful!",
          description: `Total: ${formatINR(totalCartPrice)}. Thank you for shopping!`,
          className: "border-green-500 bg-green-500/10 text-foreground",
          duration: 5000,
       });
    }, 1000);
  };

   const startNewShopping = () => {
      setCheckoutComplete(false);
      setSearchTerm('');
   }

   const navigateHome = () => {
       router.push('/');
   }

   // --- Path Navigation ---
   const nextPathStep = () => {
     if (optimalPath && currentPathIndex < optimalPath.length - 1) {
       setCurrentPathIndex(prevIndex => prevIndex + 1);
     }
   };

   const prevPathStep = () => {
     if (currentPathIndex > 0) {
       setCurrentPathIndex(prevIndex => prevIndex - 1);
     }
   };

   const closePathModal = () => {
       setIsPathModalOpen(false);
   }

   const openPathModal = () => {
       if (optimalPath) {
           setIsPathModalOpen(true);
       } else {
            showToast({
                title: "No Path Available",
                description: "Generate an optimal path sequence first.",
                variant: "destructive",
            });
       }
   }
   // --- End Path Navigation ---

  if (checkoutComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
        <Card className="w-full max-w-md text-center shadow-xl border-green-500/50 animate-in fade-in zoom-in-95 duration-500">
          <CardHeader>
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4 animate-pulse" />
            <CardTitle className="text-3xl font-bold text-primary">Checkout Successful!</CardTitle>
            <CardDescription className="text-muted-foreground text-lg mt-2">
              Your purchase is complete. Thank you for using NavLa.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground mb-6">Ready for your next shopping adventure?</p>
             <Button onClick={startNewShopping} className="w-full bg-gradient-to-r from-accent to-teal-500 hover:from-accent/90 hover:to-teal-500/90 text-accent-foreground transition-all duration-300 transform hover:scale-105 shadow-md">
               Start New Shopping Trip
             </Button>
              <Button variant="outline" onClick={navigateHome} className="w-full mt-4">
                <Home className="mr-2 h-4 w-4" /> Go Back Home
              </Button>
          </CardContent>
        </Card>
         <footer className="mt-8 text-center text-muted-foreground text-xs opacity-70">
              © {new Date().getFullYear()} NavLa. Smart Shopping Assistant.
          </footer>
      </div>
    );
  }


  return (
   <TooltipProvider delayDuration={100}>
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen">
        {/* --- Sidebar --- */}
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r border-border/40 shadow-lg bg-gradient-to-b from-card to-background">
          <SidebarHeader className="p-4 border-b border-border/30">
             {/* Logo and Title */}
             <div className="flex items-center gap-2 group-data-[state=expanded]:opacity-100 group-data-[state=collapsed]:opacity-0 transition-opacity duration-200">
                 <div className="bg-primary p-2 rounded-md shadow-inner">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-foreground">
                       <path d="M12 2C8.13 2 5 5.13 5 9c0 4.17 4.42 9.92 6.24 12.11a1 1 0 0 0 1.52 0C14.58 18.92 19 13.17 19 9c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="currentColor" opacity="0.6"/>
                       <path d="M6.5 7.5L12 11l5.5-3.5M12 11v6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                 </div>
                 <h2 className="text-xl font-semibold text-primary">NavLa User</h2>
             </div>
             {/* Collapse Trigger */}
              <SidebarTrigger className="absolute top-3 right-2 group-data-[state=expanded]:rotate-0 group-data-[state=collapsed]:rotate-180 transition-transform duration-300" />
          </SidebarHeader>

          {/* Cart Content */}
          <SidebarContent className="p-0">
             <ScrollArea className="h-full px-4 py-2">
              <h3 className="text-lg font-semibold mb-2 text-muted-foreground group-data-[state=expanded]:opacity-100 group-data-[state=collapsed]:opacity-0 transition-opacity duration-200">Your Cart</h3>
              {cart.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 group-data-[state=expanded]:opacity-100 group-data-[state=collapsed]:opacity-0 transition-opacity duration-200">
                    <ShoppingCart className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    Your cart is empty. <br/> Add products from the list.
                </div>
              ) : (
                <ul className="space-y-3 group-data-[state=expanded]:opacity-100 group-data-[state=collapsed]:opacity-0 transition-opacity duration-200">
                  {cart.map(item => (
                    <li key={item.id} className="flex items-center gap-3 p-2 bg-card rounded-lg shadow-sm border border-border/30 hover:bg-muted/50 transition-colors duration-200">
                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                            <span className="whitespace-nowrap">{formatINR(item.price * (1 - (item.discount || 0)))}</span>
                            {item.discount && item.discount > 0 && (
                              <Badge variant="destructive" className="text-xs px-1 py-0 leading-none">{(item.discount * 100)}% off</Badge>
                            )}
                             <span className="whitespace-nowrap">x {item.quantity}</span>
                        </div>
                      </div>
                      {/* Quantity Controls */}
                       <div className="flex items-center gap-1 shrink-0">
                           <Tooltip>
                               <TooltipTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                       <Minus className="h-4 w-4" />
                                   </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom"><p>Decrease Quantity</p></TooltipContent>
                            </Tooltip>
                         <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                           <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        disabled={item.stock !== undefined && item.quantity >= item.stock}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom"><p>Increase Quantity {item.stock !== undefined && item.quantity >= item.stock ? '(Max Reached)' : ''}</p></TooltipContent>
                            </Tooltip>
                       </div>
                       {/* Remove Button */}
                       <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-6 w-6 shrink-0" onClick={() => removeFromCart(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Remove Item</p></TooltipContent>
                        </Tooltip>
                    </li>
                  ))}
                </ul>
              )}
              </ScrollArea>
          </SidebarContent>

          {/* Footer Actions */}
          <SidebarFooter className="p-4 border-t border-border/30 mt-auto">
             {/* Expanded View */}
             <div className="group-data-[state=expanded]:opacity-100 group-data-[state=collapsed]:opacity-0 transition-opacity duration-200">
                  {/* Totals */}
                  <div className="flex justify-between items-center mb-2 font-medium text-muted-foreground">
                    <span>Total Items:</span>
                    <Badge variant="secondary">{totalCartItems}</Badge>
                  </div>
                  <div className="flex justify-between items-center mb-4 text-lg font-semibold">
                    <span>Total Price:</span>
                    <span className="text-primary">{formatINR(totalCartPrice)}</span>
                  </div>
                  <Separator className="my-3"/>
                  {/* Buttons */}
                   <Tooltip>
                       <TooltipTrigger asChild>
                           <Button
                             onClick={handleGeneratePath}
                             disabled={isGeneratingPath || cart.length === 0}
                             className="w-full mb-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground shadow-md transition-all duration-300 transform hover:scale-105"
                           >
                             {isGeneratingPath ? (
                                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                             ) : (
                                 <MapPinned className="mr-2 h-4 w-4" />
                             )}
                             {isGeneratingPath ? 'Generating...' : 'Generate Optimal Path'}
                           </Button>
                       </TooltipTrigger>
                       <TooltipContent side="top">
                           {cart.length === 0 ? <p>Add items to cart first</p> : <p>Generate the most efficient sequence to collect your items</p>}
                       </TooltipContent>
                   </Tooltip>
                   {optimalPath && (
                       <Tooltip>
                           <TooltipTrigger asChild>
                               <Button
                                   onClick={openPathModal}
                                   variant="secondary"
                                   className="w-full mb-2"
                               >
                                   <Eye className="mr-2 h-4 w-4" /> View Path
                               </Button>
                           </TooltipTrigger>
                           <TooltipContent side="top">
                               <p>Open the map and path sequence details</p>
                           </TooltipContent>
                       </Tooltip>
                   )}
                   <Tooltip>
                       <TooltipTrigger asChild>
                            <Button
                               onClick={handleCheckout}
                               disabled={isCheckingOut || cart.length === 0 || !!(optimalPath && optimalPath[currentPathIndex] !== 'Checkout')}
                               className="w-full bg-gradient-to-r from-accent to-teal-500 hover:from-accent/90 hover:to-teal-500/90 text-accent-foreground shadow-md transition-all duration-300 transform hover:scale-105"
                               >
                                  {isCheckingOut ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                  )}
                                  {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
                              </Button>
                       </TooltipTrigger>
                       <TooltipContent side="top">
                           {cart.length === 0 ? <p>Your cart is empty</p> : (optimalPath && optimalPath[currentPathIndex] !== 'Checkout' ? <p>Navigate to the Checkout location in the sequence</p> : <p>Finalize your purchase</p>)}
                       </TooltipContent>
                   </Tooltip>
                    <Button variant="outline" onClick={navigateHome} className="w-full mt-4">
                      <Home className="mr-2 h-4 w-4" /> Go Back Home
                    </Button>
             </div>
             {/* Icon-only view for collapsed state */}
             <div className="group-data-[state=collapsed]:opacity-100 group-data-[state=expanded]:opacity-0 transition-opacity duration-200 space-y-2">
                 <SidebarMenuButton tooltip="View Cart" size="sm" className="mx-auto relative">
                     <ShoppingCart />
                      {totalCartItems > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 justify-center text-xs">{totalCartItems}</Badge>
                      )}
                 </SidebarMenuButton>
                 <SidebarMenuButton tooltip="Generate Optimal Path" size="sm" onClick={handleGeneratePath} disabled={isGeneratingPath || cart.length === 0} className="mx-auto">
                    {isGeneratingPath ? <Loader2 className="animate-spin" /> : <MapPinned />}
                 </SidebarMenuButton>
                 {optimalPath && (
                      <SidebarMenuButton tooltip="View Path" size="sm" onClick={openPathModal} className="mx-auto">
                         <Eye />
                      </SidebarMenuButton>
                 )}
                 <SidebarMenuButton tooltip="Checkout" size="sm" onClick={handleCheckout} disabled={!!(isCheckingOut || cart.length === 0 || (optimalPath && optimalPath[currentPathIndex] !== 'Checkout'))} className="mx-auto">
                    {isCheckingOut ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                 </SidebarMenuButton>
                 <SidebarMenuButton tooltip="Go Home" size="sm" onClick={navigateHome} variant="outline" className="mx-auto">
                    <Home />
                 </SidebarMenuButton>
             </div>
          </SidebarFooter>
        </Sidebar>

        {/* --- Main Content Area --- */}
        <SidebarInset className="flex-1 bg-gradient-to-br from-background via-muted/10 to-secondary/20">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6 shadow-sm">
            <SidebarTrigger className="md:hidden" /> {/* Mobile trigger */}
            <h1 className="text-xl font-semibold text-foreground">Browse Products</h1>
            {/* Search and Path Badge */}
            <div className="ml-auto flex items-center gap-4">
              <Input
                type="search"
                placeholder="Search products..."
                className="w-48 sm:w-64 bg-card border-border/50 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
               {optimalPath && (
                 <Badge variant="outline" className="border-primary text-primary hidden sm:flex items-center gap-1 cursor-pointer" onClick={openPathModal}>
                   <MapPinned className="h-4 w-4"/> Path Generated
                 </Badge>
               )}
            </div>
          </header>

          {/* Product Grid */}
          <main className="flex-1 p-6">
             <ScrollArea className="h-[calc(100vh-8rem)] pr-2"> {/* Adjusted height & added padding-right for scrollbar */}
                {isClient ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {filteredProducts.map(product => {
                       const isAtCurrentLocation = optimalPath && optimalPath[currentPathIndex] === product.location;
                       const cartItem = cart.find(item => item.id === product.id);
                       const isOutOfStock = product.stock !== undefined && product.stock <= 0;
                       return (
                         <Card key={product.id} className={`flex flex-col group hover:shadow-lg transition-all duration-300 relative overflow-hidden border ${
                             isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''} ${
                             isAtCurrentLocation ? 'border-primary ring-2 ring-primary/50 shadow-lg scale-105' : 'border-border/30'} ${
                             cartItem ? 'bg-primary/5' : 'bg-card'}`}>
                            {/* Badges */}
                            {isOutOfStock && (
                               <Badge variant="destructive" className="absolute top-2 left-2 z-10 text-xs px-1.5 py-0.5">Out of Stock</Badge>
                            )}
                           {isAtCurrentLocation && !isOutOfStock && (
                                <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground z-10 text-xs px-1.5 py-0.5" variant="default">Current Stop</Badge>
                           )}
                            {product.discount && product.discount > 0 && !isOutOfStock && (
                                <Badge variant="destructive" className={`absolute top-2 ${isAtCurrentLocation ? 'left-2' : 'left-2'} z-10 text-xs px-1.5 py-0.5`}>{(product.discount * 100)}% Off</Badge>
                            )}
                           {/* Product Info */}
                           <CardHeader className="p-4">
                             <CardTitle className="text-base font-semibold mb-1 truncate group-hover:text-primary transition-colors">{product.name}</CardTitle>
                             <CardDescription className="text-xs text-muted-foreground mb-2">{product.category}</CardDescription>
                           </CardHeader>
                           <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-end">
                              {/* Price & Location */}
                              <div className="flex justify-between items-center mt-auto">
                                  <div>
                                       <span className={`text-lg font-bold ${product.discount ? 'text-destructive' : 'text-primary'}`}>
                                           {formatINR(product.price * (1 - (product.discount || 0)))}
                                       </span>
                                       {product.discount && product.discount > 0 && (
                                           <span className="ml-1 text-xs text-muted-foreground line-through">{formatINR(product.price)}</span>
                                       )}
                                  </div>
                                 <Badge variant="outline" className="text-xs">{product.location}</Badge>
                              </div>
                           </CardContent>
                           {/* Add/Update Cart Controls */}
                           <CardFooter className="p-4 pt-0">
                              {cartItem ? (
                                  <div className="flex items-center justify-between w-full">
                                       <Tooltip>
                                           <TooltipTrigger asChild>
                                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, cartItem.quantity - 1)} disabled={isOutOfStock}>
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Decrease Quantity</p></TooltipContent>
                                       </Tooltip>
                                      <span className="text-lg font-medium">{cartItem.quantity}</span>
                                       <Tooltip>
                                           <TooltipTrigger asChild>
                                               <Button
                                                  variant="outline"
                                                  size="icon"
                                                  className="h-8 w-8"
                                              onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                                              disabled={!!(isOutOfStock || (product.stock !== undefined && cartItem.quantity >= product.stock))}
                                              >
                                                   <Plus className="h-4 w-4" />
                                               </Button>
                                           </TooltipTrigger>
                                           <TooltipContent>
                                               <p>Increase Quantity {product.stock !== undefined && cartItem.quantity >= product.stock ? '(Max Reached)' : ''}</p>
                                           </TooltipContent>
                                       </Tooltip>
                                  </div>
                              ) : (
                                 <Button onClick={() => addToCart(product)} className="w-full transition-transform duration-200 hover:scale-105 bg-primary/90 hover:bg-primary" disabled={isOutOfStock}>
                                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                                 </Button>
                              )}
                           </CardFooter>
                         </Card>
                       )
                   })}
                    {/* No Products Message */}
                    {filteredProducts.length === 0 && (
                      <div className="col-span-full text-center text-muted-foreground py-10">
                        <SearchIcon className="mx-auto h-12 w-12 mb-2 opacity-50"/>
                        {searchTerm ? `No products found matching "${searchTerm}".` : "No products available."}
                      </div>
                    )}
                 </div>
                  ) : (
                    // --- Skeleton Loading State ---
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {[...Array(12)].map((_, i) => (
                        <Card key={i} className="flex flex-col group border border-border/30 bg-card">
                          <CardHeader className="p-4">
                            <Skeleton className="h-5 bg-muted animate-pulse rounded w-3/4 mb-2"></Skeleton>
                            <Skeleton className="h-4 bg-muted animate-pulse rounded w-1/2 mb-4"></Skeleton>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-end">
                            <div className="flex justify-between items-center mt-auto">
                              <Skeleton className="h-6 bg-muted animate-pulse rounded w-1/4"></Skeleton>
                              <Skeleton className="h-5 bg-muted animate-pulse rounded w-1/5"></Skeleton>
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 pt-0">
                            <Skeleton className="h-10 bg-muted animate-pulse rounded w-full"></Skeleton>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
             </ScrollArea>
          </main>
        </SidebarInset>
      </div>

      {/* Optimal Path Modal */}
      {/* Render modal only on client-side after mount */}
      {isClient && (
        <OptimalPathModal
            isOpen={isPathModalOpen}
            onClose={closePathModal}
            optimalPath={optimalPath} // Pass the sequence
            currentStepIndex={currentPathIndex}
            onNextStep={nextPathStep}
            onPrevStep={prevPathStep}
            layout={storeLayoutParsed}
            cartItemLocations={cartItemLocations}
        />
      )}

    </SidebarProvider>
   </TooltipProvider>
  );
}
