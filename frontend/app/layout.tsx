import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@mysten/dapp-kit/dist/index.css";
import Header from '../components/Header';
import ClientProviders from './ClientProviders';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sui Recurring Payments",
  description: "A protocol for recurring payments on the Sui blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto text-center">
              <p>© 2023 Sui Recurring Payments Protocol</p>
            </div>
          </footer>
        </div>
        </ClientProviders>
      </body>
    </html>
  );
}
