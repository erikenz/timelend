import type { Metadata } from "next";
import localFont from "next/font/local";
import { Navbar } from "../components/Navbar";
import './globals.css';
import { Providers } from './providers';

import { WagmiProvider } from 'wagmi'
import { config } from '../lib/wagmi'


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "TimeLend",
    template: "%s | TimeLend",
  },
  description: "Plataforma de compromisos financieros con soporte Web3.",
  openGraph: {
    title: "TimeLend",
    description: "Plataforma de compromisos financieros con soporte Web3.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
