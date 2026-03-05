import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "./ThemeProvider";

export const metadata = {
  title: "Instagram Clone",
  description: "A modern Instagram clone built with Next.js and Convex",
  openGraph: {
    title: "Instagram Clone",
    description: "A modern Instagram clone built with Next.js and Convex",
    images: [
      {
        url: "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Instagram Clone",
    description: "A modern Instagram clone built with Next.js and Convex",
    images: [
      "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ConvexClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
            <Toaster position="top-right" richColors closeButton />
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
