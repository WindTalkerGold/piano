import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MIDI Library Manager",
  description: "Local MIDI to Sheet Music Web Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <Script src="https://cdn.jsdelivr.net/combine/npm/tone@14.7.58,npm/@magenta/music@1.23.1/es6/core.js,npm/focus-visible@5,npm/html-midi-player@1.5.0" strategy="afterInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.6/build/opensheetmusicdisplay.min.js" strategy="afterInteractive" />
        <Script src="/vendor/osmd-audio-player.min.js" strategy="afterInteractive" />
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t bg-white py-6">
            <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
              <p>MIDI Library Manager • Local sheet music management tool</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
