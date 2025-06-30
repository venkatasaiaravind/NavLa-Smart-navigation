
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Database, Receipt, Map, Package, Settings, Home, Edit, Trash2, PlusCircle, Loader2, MapPin } from 'lucide-react'; // Changed icon
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { mockProductsData, storeLayoutParsed } from '@/lib/store-data';
import type { Product } from '@/types/product';
import type { Bill } from '@/types/bill';

// Mock bills (replace with actual data source) - Keeping this local for now
const mockBills: Bill[] = [
  { id: 'bill1', customerId: 'cust123', date: new Date(), totalAmount: 1260.00, items: [{ id: 'prod1', name: 'Organic Apples', price: 180, quantity: 5 }, { id: 'prod2', name: 'Whole Milk (1L)', price: 65, quantity: 2 }] },
  { id: 'bill2', customerId: 'cust456', date: new Date(Date.now() - 86400000), totalAmount: 2040.00, items: [{ id: 'prod3', name: 'Sourdough Bread', price: 150, quantity: 1 }, { id: 'prod4', name: 'Chicken Breast (500g)', price: 250, quantity: 1 }] },
];

// Helper function to format currency in INR
const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('data');
  const [products, setProducts] = useState<Product[]>(mockProductsData);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = checking, false = not auth, true = auth

  useEffect(() => {
      // Basic client-side authentication check (INSECURE)
      if (typeof window !== 'undefined') {
          const authFlag = sessionStorage.getItem('isAdminAuthenticated');
          if (authFlag !== 'true') {
              toast({
                  title: "Authentication Required",
                  description: "Please login to access the admin panel.",
                  variant: "destructive"
              });
              router.replace('/'); // Use replace to prevent back navigation
              setIsAuthenticated(false);
          } else {
              setIsAuthenticated(true);
          }
      }
  }, [router, toast]);

   const navigateHome = () => {
       // Clear auth flag on explicit navigation away
       if (typeof window !== 'undefined') {
           sessionStorage.removeItem('isAdminAuthenticated');
       }
       router.push('/');
   }

  const handleEditProduct = (product: Product) => {
    setEditingProduct({...product});
  };

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     if (!editingProduct) return;

     setProducts(prev =>
        prev.map(p => p.id === editingProduct.id ? editingProduct : p)
     );
     toast({ title: "Product Updated", description: `${editingProduct.name} details saved.`, className: "border-primary bg-primary/10 text-foreground" });
     setEditingProduct(null);
  };

   const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     const formData = new FormData(e.currentTarget);
     const newProductData = {
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        price: formData.get('price') as string,
        location: formData.get('location') as string,
        stock: formData.get('stock') as string,
        discount: formData.get('discount') as string,
        keywords: formData.get('keywords') as string,
     }

     const priceNum = parseFloat(newProductData.price);
     const stockNum = parseInt(newProductData.stock);
     const discountNum = parseFloat(newProductData.discount);


     if (!newProductData.name || isNaN(priceNum) || !newProductData.location || isNaN(stockNum) ) {
       toast({ title: "Error", description: "Please fill all required fields (Name, Price, Location, Stock).", variant: "destructive" });
       return;
     }

     const newProduct: Product = {
       id: `prod${Date.now()}`,
       name: newProductData.name,
       category: newProductData.category || 'Uncategorized',
       price: priceNum,
       location: newProductData.location,
       stock: stockNum,
       discount: !isNaN(discountNum) ? discountNum / 100 : 0,
       keywords: newProductData.keywords || newProductData.name.toLowerCase().split(' ')[0] || 'product',
     };


     setProducts(prev => [...prev, newProduct]);
     toast({ title: "Product Added", description: `${newProduct.name} added successfully.`, className: "border-accent bg-accent/10 text-foreground" });
     setIsAddModalOpen(false);
     e.currentTarget.reset();
   };


  const handleDeleteProduct = (productId: string) => {
     setProducts(prev => prev.filter(p => p.id !== productId));
     toast({ title: "Product Deleted", description: `Product removed.`, variant: "destructive" });
  }

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-background">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
      );
  }

   // If not authenticated (useEffect already triggered redirect, this is a fallback)
   if (!isAuthenticated) {
       return null; // Or display an "Access Denied" message if redirect fails
   }

  // Render admin content only if authenticated
  const renderSection = () => {
    switch (activeSection) {
      case 'data':
        return (
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Overall Dashboard</CardTitle>
              <CardDescription>Summary of store performance and statistics.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                   <Card className="bg-card/50 border border-border/30 hover:shadow-md transition-shadow">
                      <CardHeader>
                         <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground"><Receipt className="w-5 h-5"/>Total Bills Today</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-3xl font-bold text-primary">{mockBills.filter(b => b.date.toDateString() === new Date().toDateString()).length}</p>
                      </CardContent>
                   </Card>
                    <Card className="bg-card/50 border border-border/30 hover:shadow-md transition-shadow">
                      <CardHeader>
                         <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground"><Package className="w-5 h-5"/>Total Products</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-3xl font-bold text-primary">{products.length}</p>
                      </CardContent>
                   </Card>
                   <Card className="bg-card/50 border border-border/30 hover:shadow-md transition-shadow">
                       <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground"><Database className="w-5 h-5"/>Total Stock Value</CardTitle>
                       </CardHeader>
                       <CardContent>
                           <p className="text-3xl font-bold text-primary">{formatINR(products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0))}</p>
                       </CardContent>
                   </Card>
               </div>
                <p className="text-muted-foreground mt-8">More detailed statistics and charts will be displayed here.</p>
            </CardContent>
          </Card>
        );
      case 'bills':
        return (
           <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Customer Bills</CardTitle>
              <CardDescription>View transaction history.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-18rem)] border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted">
                    <TableRow>
                      <TableHead>Bill ID</TableHead>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total (INR)</TableHead>
                      <TableHead>Items</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockBills.map(bill => (
                      <TableRow key={bill.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{bill.id}</TableCell>
                        <TableCell>{bill.customerId}</TableCell>
                        <TableCell>{bill.date.toLocaleDateString()}</TableCell>
                        <TableCell>{formatINR(bill.totalAmount)}</TableCell>
                        <TableCell className="text-xs">
                            {bill.items.map(i => (
                                <Badge key={i.id} variant="outline" className="mr-1 mb-1">{i.name} (x{i.quantity})</Badge>
                            ))}
                        </TableCell>
                      </TableRow>
                    ))}
                     {mockBills.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No bills found.</TableCell>
                        </TableRow>
                     )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      case 'map':
        return (
           <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Store Map Layout</CardTitle>
              <CardDescription>Visualize product placements.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="overflow-x-auto p-1">
                 <div className="inline-block min-w-full p-4 border rounded-lg bg-gradient-to-br from-muted/10 to-background shadow-inner">
                   {storeLayoutParsed.map((row, rowIndex) => (
                     <div key={rowIndex} className="flex">
                       {row.map((cell, cellIndex) => {
                         const cellId = `${String.fromCharCode(65 + rowIndex)}${cellIndex + 1}`;
                         const productsInCell = products.filter(p => p.location === cellId);
                         const cellContent = cell.split(':')[0];

                         return (
                           <div
                             key={`${rowIndex}-${cellIndex}`}
                             className={`border border-border/50 p-3 w-36 h-32 flex flex-col items-center justify-center text-center text-xs relative group transition-all duration-200 hover:scale-105 hover:z-10 hover:shadow-lg
                               ${cellContent === 'Empty' ? 'bg-muted/30 text-muted-foreground/50' : 'bg-card'}
                               ${cellContent === 'Entrance' ? 'bg-green-600/20 text-green-400 font-bold' : ''}
                               ${cellContent === 'Checkout' ? 'bg-blue-600/20 text-blue-400 font-bold' : ''}
                               ${productsInCell.length > 0 ? 'cursor-pointer' : ''}
                             `}
                           >
                             <Badge variant="secondary" className="absolute top-1 left-1 text-xs">{cellId}</Badge>
                             <span className="font-medium mt-1">{cellContent}</span>
                             {cell.includes(':') && <span className="text-muted-foreground text-[10px] mt-1">{cell.split(':')[1]}</span>}
                              {productsInCell.length > 0 && (
                                  <div className="mt-2 text-center">
                                      <Package className="w-5 h-5 mx-auto text-primary mb-1"/>
                                      <span className="text-[10px] font-medium">{productsInCell.length} product(s)</span>
                                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-y-auto">
                                          <p className="text-white font-bold mb-1">Products:</p>
                                          <ul className="text-left text-white text-[10px] space-y-0.5">
                                              {productsInCell.slice(0, 3).map(p => <li key={p.id} className="truncate"> - {p.name}</li>)}
                                              {productsInCell.length > 3 && <li>... and {productsInCell.length - 3} more</li>}
                                          </ul>
                                      </div>
                                  </div>
                              )}
                              {cellContent !== 'Empty' && cellContent !== 'Entrance' && cellContent !== 'Checkout' && productsInCell.length === 0 && !cell.includes(':') && <span className="text-muted-foreground/70">(Empty)</span>}
                           </div>
                         );
                       })}
                     </div>
                   ))}
                 </div>
               </div>
            </CardContent>
          </Card>
        );
      case 'products':
         return (
            <Card className="shadow-lg border-primary/20">
             <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl text-primary">Product Management</CardTitle>
                    <CardDescription>Add, edit, or remove products and update details.</CardDescription>
                </div>
                 <Button onClick={() => setIsAddModalOpen(true)} className="bg-gradient-to-r from-accent to-teal-500 hover:from-accent/90 hover:to-teal-500/90 text-accent-foreground shadow-md transition-transform hover:scale-105">
                    <PlusCircle className="mr-2 h-4 w-4"/> Add Product
                 </Button>
             </CardHeader>
             <CardContent>
               <ScrollArea className="h-[calc(100vh-18rem)] border rounded-lg">
                 <Table>
                   <TableHeader className="sticky top-0 bg-muted">
                     <TableRow>
                       <TableHead className="w-[250px]">Name</TableHead>
                       <TableHead>Category</TableHead>
                       <TableHead>Price (INR)</TableHead>
                       <TableHead>Location</TableHead>
                       <TableHead>Stock</TableHead>
                       <TableHead>Discount</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {products.map(product => (
                       <TableRow key={product.id} className="hover:bg-muted/50 transition-colors">
                         <TableCell className="font-medium">{product.name}</TableCell>
                         <TableCell>{product.category}</TableCell>
                         <TableCell>{formatINR(product.price)}</TableCell>
                         <TableCell><Badge variant="secondary">{product.location}</Badge></TableCell>
                         <TableCell>{product.stock}</TableCell>
                         <TableCell>{(product.discount || 0) * 100}%</TableCell>
                         <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                               <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)} className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-500">
                                 <Edit className="h-4 w-4" />
                               </Button>
                               <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)} className="text-red-400 hover:bg-red-500/10 hover:text-destructive">
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                            </div>
                         </TableCell>
                       </TableRow>
                     ))}
                       {products.length === 0 && (
                           <TableRow>
                               <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No products found. Click 'Add Product' to start.</TableCell>
                           </TableRow>
                       )}
                   </TableBody>
                 </Table>
               </ScrollArea>
             </CardContent>
           </Card>
         );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen">
         <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r border-border/40 shadow-lg bg-gradient-to-b from-card to-background">
          <SidebarHeader className="p-4 border-b border-border/30">
              <div className="flex items-center gap-2 group-data-[state=expanded]:opacity-100 group-data-[state=collapsed]:opacity-0 transition-opacity duration-200">
                 {/* Updated Admin NavLa Logo */}
                 <div className="bg-primary p-2 rounded-md shadow-inner">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-foreground">
                       <path d="M12 2C8.13 2 5 5.13 5 9c0 4.17 4.42 9.92 6.24 12.11a1 1 0 0 0 1.52 0C14.58 18.92 19 13.17 19 9c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="currentColor" opacity="0.6"/>
                       <path d="M6.5 7.5L12 11l5.5-3.5M12 11v6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                 </div>
                 <h2 className="text-xl font-semibold text-primary">NavLa Admin</h2>
              </div>
              <SidebarTrigger className="absolute top-3 right-2 group-data-[state=expanded]:rotate-0 group-data-[state=collapsed]:rotate-180 transition-transform duration-300" />
          </SidebarHeader>
          <SidebarContent className="flex-1 p-0">
            <SidebarMenu className="p-4 space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveSection('data')} isActive={activeSection === 'data'} tooltip="Dashboard">
                  <Database />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveSection('bills')} isActive={activeSection === 'bills'} tooltip="Customer Bills">
                  <Receipt />
                  <span>Customer Bills</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveSection('map')} isActive={activeSection === 'map'} tooltip="Store Map">
                  <Map />
                  <span>Store Map</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveSection('products')} isActive={activeSection === 'products'} tooltip="Manage Products">
                  <Package />
                  <span>Manage Products</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
           <SidebarFooter className="p-4 border-t border-border/30 mt-auto">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Settings (Placeholder)" disabled>
                          <Settings />
                          <span>Settings</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton onClick={navigateHome} tooltip="Go Home & Logout" variant="outline">
                            <Home />
                            <span>Go Home</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
           </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 bg-gradient-to-br from-background via-muted/10 to-secondary/20">
           <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6 shadow-sm">
            <SidebarTrigger className="md:hidden" />
             <h1 className="text-xl font-semibold text-foreground capitalize">{activeSection} Management</h1>
          </header>

          <main className="flex-1 p-6">
            {renderSection()}
          </main>
        </SidebarInset>
      </div>

      {/* Edit Product Modal */}
       <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
         <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
           <DialogHeader>
             <DialogTitle>Edit Product: {editingProduct?.name}</DialogTitle>
             <DialogDescription>Update product details below. Click Save when done.</DialogDescription>
           </DialogHeader>
            {editingProduct && (
             <form onSubmit={handleSaveProduct} className="space-y-4 py-4">
               <div>
                 <Label htmlFor="edit-name" className="text-right">Name *</Label>
                 <Input id="edit-name" required value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="col-span-3" />
               </div>
               <div>
                 <Label htmlFor="edit-category" className="text-right">Category</Label>
                 <Input id="edit-category" value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} className="col-span-3" />
               </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="edit-price" className="text-right">Price (INR) *</Label>
                     <Input id="edit-price" type="number" step="0.01" required value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} />
                   </div>
                   <div>
                     <Label htmlFor="edit-location" className="text-right">Location *</Label>
                     <Input id="edit-location" required value={editingProduct.location} onChange={(e) => setEditingProduct({...editingProduct, location: e.target.value})} />
                   </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-stock" className="text-right">Stock *</Label>
                      <Input id="edit-stock" type="number" required value={editingProduct.stock ?? 0} onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value) || 0})} />
                    </div>
                    <div>
                      <Label htmlFor="edit-discount" className="text-right">Discount (%)</Label>
                      <Input id="edit-discount" type="number" step="0.1" value={(editingProduct.discount || 0) * 100} onChange={(e) => setEditingProduct({...editingProduct, discount: (parseFloat(e.target.value) || 0) / 100})} />
                    </div>
                 </div>
                   <div>
                    <Label htmlFor="edit-keywords" className="text-right">Keywords (comma-separated)</Label>
                    <Input id="edit-keywords" value={editingProduct.keywords || ''} onChange={(e) => setEditingProduct({...editingProduct, keywords: e.target.value})} className="col-span-3" />
                  </div>
               <DialogFooter>
                 <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                 <Button type="submit">Save Changes</Button>
               </DialogFooter>
             </form>
            )}
         </DialogContent>
       </Dialog>

        {/* Add Product Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
             <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
               <DialogHeader>
                 <DialogTitle>Add New Product</DialogTitle>
                 <DialogDescription>Enter the details for the new product.</DialogDescription>
               </DialogHeader>
                 <form onSubmit={handleAddProduct} className="space-y-4 py-4">
                   <div>
                     <Label htmlFor="add-name">Name *</Label>
                     <Input id="add-name" name="name" required />
                   </div>
                   <div>
                     <Label htmlFor="add-category">Category</Label>
                     <Input id="add-category" name="category" />
                   </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="add-price">Price (INR) *</Label>
                         <Input id="add-price" name="price" type="number" step="0.01" required />
                       </div>
                       <div>
                         <Label htmlFor="add-location">Location *</Label>
                         <Input id="add-location" name="location" placeholder="e.g., A1, B3" required />
                       </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="add-stock">Stock *</Label>
                          <Input id="add-stock" name="stock" type="number" required />
                        </div>
                        <div>
                          <Label htmlFor="add-discount">Discount (%)</Label>
                          <Input id="add-discount" name="discount" type="number" step="0.1" defaultValue={0} placeholder="e.g., 10 for 10%" />
                        </div>
                     </div>
                       <div>
                        <Label htmlFor="add-keywords">Keywords (comma-separated)</Label>
                        <Input id="add-keywords" name="keywords" placeholder="e.g., fruit, organic, sweet" />
                      </div>
                   <DialogFooter>
                     <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); }}>Cancel</Button>
                     <Button type="submit">Add Product</Button>
                   </DialogFooter>
                 </form>
             </DialogContent>
           </Dialog>


    </SidebarProvider>
  );
}
