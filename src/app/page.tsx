
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
// Update the import path below if your Tabs components are located elsewhere
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Smartphone, UserCog, AlertTriangle, LogIn, MapPin } from "lucide-react"; // Changed icon for logo
import { useRouter } from 'next/navigation';
import { useToast } from "../hooks/use-toast";

// Hardcoded admin password - INSECURE for production!
const ADMIN_PASSWORD = "admin123";

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isClient, setIsClient] = useState(false);

   useEffect(() => {
       setIsClient(true); // Component has mounted
       // Clear session storage on initial load of home page
       if (typeof window !== 'undefined') {
           sessionStorage.removeItem('isAdminAuthenticated');
       }
   }, []);


  const navigateToUser = () => {
    router.push('/user');
  };

  const openAdminPasswordModal = () => {
    setPasswordInput(''); // Clear password input on open
    setPasswordError(''); // Clear error on open
    setIsPasswordModalOpen(true);
  };

  const handleAdminLogin = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     if (passwordInput === ADMIN_PASSWORD) {
       // Password correct
       setPasswordError('');
       setIsPasswordModalOpen(false);
       // Set a flag in sessionStorage (INSECURE, client-side only)
       if (typeof window !== 'undefined') {
         sessionStorage.setItem('isAdminAuthenticated', 'true');
       }
       router.push('/admin');
     } else {
       // Password incorrect
       setPasswordError('Incorrect password.');
       toast({
         title: "Login Failed",
         description: "Incorrect password. Please try again.",
         variant: "destructive",
       });
     }
  }

   // Prevent rendering dialog during SSR/initial hydration mismatch potential
   if (!isClient) {
       return null; // Or a loading skeleton
   }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/10 to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 transform transition-all hover:scale-[1.01] duration-300 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          {/* Updated NavLa Logo */}
          <div className="inline-block bg-gradient-to-br from-primary to-purple-600 p-4 rounded-lg mb-6 mx-auto shadow-lg transition-transform hover:rotate-[-6deg] duration-300">
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-foreground">
                 <path d="M12 2C8.13 2 5 5.13 5 9c0 4.17 4.42 9.92 6.24 12.11a1 1 0 0 0 1.52 0C14.58 18.92 19 13.17 19 9c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="currentColor" opacity="0.6"/>
                 <path d="M6.5 7.5L12 11l5.5-3.5M12 11v6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
          <CardTitle className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-teal-400 pb-1">
            NavLa
          </CardTitle>
          <CardDescription className="text-muted-foreground text-lg">
            Smart Shopping Assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 border border-border/30">
              <TabsTrigger value="user" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex items-center gap-2 transition-colors duration-200 py-2">
                <Smartphone className="h-5 w-5" /> Shop
              </TabsTrigger>
              <TabsTrigger value="admin" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex items-center gap-2 transition-colors duration-200 py-2">
                <UserCog className="h-5 w-5" /> Admin
              </TabsTrigger>
            </TabsList>
            <TabsContent value="user" className="flex flex-col items-center space-y-3">
              <p className="text-center text-sm text-muted-foreground px-4">Browse products, manage your cart, and generate the optimal shopping route.</p>
              <Button onClick={navigateToUser} className="w-full bg-gradient-to-r from-accent to-teal-500 hover:from-accent/90 hover:to-teal-500/90 text-accent-foreground transition-all duration-300 transform hover:scale-105 shadow-md py-3 text-base font-semibold">
                 <LogIn className="mr-2 h-5 w-5"/> Start Shopping
              </Button>
            </TabsContent>
            <TabsContent value="admin" className="flex flex-col items-center space-y-3">
               <p className="text-center text-sm text-muted-foreground px-4">Manage store layout, products, and view bills. Requires admin privileges.</p>
              <Button onClick={openAdminPasswordModal} variant="secondary" className="w-full bg-gradient-to-r from-secondary to-muted hover:from-secondary/90 hover:to-muted/90 text-secondary-foreground transition-all duration-300 transform hover:scale-105 shadow-md py-3 text-base font-semibold">
                 <LogIn className="mr-2 h-5 w-5"/> Access Admin Panel
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
       <footer className="mt-8 text-center text-muted-foreground text-sm opacity-80">
          © {new Date().getFullYear()} NavLa.
        </footer>

      {/* Admin Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Admin Access</DialogTitle>
            <DialogDescription>
              Enter the admin password to continue.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-4 py-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className={passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}
                placeholder="Enter password"
              />
              {passwordError && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> {passwordError}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
              <Button type="submit">Login</Button>
            </DialogFooter>
          </form>
           <div className="text-xs text-muted-foreground text-center mt-2 opacity-70">
              (Hint: The password is 'admin123' for this demo)
           </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
