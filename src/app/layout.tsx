'use client';

import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/app-context';
import { Toaster } from '@/components/ui/toaster';
import { LayoutShell } from '@/components/layout-shell';
import { useEffect } from 'react';

// This is outside the component because metadata can't be in a client component
const metadata: Metadata = {
  title: 'RagInfo',
  description: 'AI-powered chat with your documents.',
  manifest: '/manifest.webmanifest',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#334185" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="font-body antialiased">
        <AppProvider>
          <LayoutShell>{children}</LayoutShell>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
