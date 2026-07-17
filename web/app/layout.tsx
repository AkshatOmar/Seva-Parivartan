import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Seva Parivartan – Mutual Transfer Matching for Central Govt Employees',
  description:
    'Find your perfect mutual transfer match instantly. Seva Parivartan connects central government employees who want to swap postings — saving years of waiting.',
  keywords: ['mutual transfer', 'government employee', 'central government', 'transfer match', 'seva parivartan'],
  openGraph: {
    title: 'Seva Parivartan',
    description: 'Mutual transfer matching for central government employees',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
