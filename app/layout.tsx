import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'CoinsDash',
  description: 'Excel/CSV coin data visualizer',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
