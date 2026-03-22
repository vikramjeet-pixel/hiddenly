import type { Metadata } from "next";
import { Public_Sans, Playfair_Display } from "next/font/google";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import { AuthProvider } from "@/context/AuthContext";
import { SearchProvider } from "@/context/SearchContext";
import { LocationProvider } from "@/context/LocationContext";
import SearchOverlay from "@/components/SearchOverlay";
import ToasterProvider from "@/components/ToasterProvider";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NomadSecret — Social Travel App",
  description: "Discover secret travel destinations shared by real travelers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${publicSans.variable} ${playfairDisplay.variable} antialiased`}>
        {/* WRAPPED ENTIRE APP IN AUTH PROVIDER */}
        <AuthProvider>
          <LocationProvider>
            <SearchProvider>
              <ToasterProvider />
              <SearchOverlay />
              <ResponsiveLayout>
                {children}
              </ResponsiveLayout>
            </SearchProvider>
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
