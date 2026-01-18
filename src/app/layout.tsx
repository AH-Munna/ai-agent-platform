import "~/styles/globals.css";

import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "./Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});
// ... 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable}`}>
        <Providers>
            {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
