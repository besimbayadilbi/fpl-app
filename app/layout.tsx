import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ReactNode } from "react";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FPL Assistant - Fantasy Premier League Team Selector",
  description:
    "Make smarter FPL decisions with AI-powered predictions, transfer suggestions, and team analysis",
  keywords: [
    "FPL",
    "Fantasy Premier League",
    "Fantasy Football",
    "FPL Tips",
    "FPL Predictions",
  ],
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
