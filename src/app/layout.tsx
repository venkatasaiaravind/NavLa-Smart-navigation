import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "../components/ui/toaster";

export const metadata: Metadata = {
  title: 'NavLa - Smart Shopping',
  description: 'Navigate stores efficiently and checkout seamlessly with NavLa.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">{/* Apply dark theme by default */}
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
