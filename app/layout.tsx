import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/toaster"
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { FloatingCallWidget } from "@/app/(sales)/call_widget/call_widget"
import { useCall } from "@/lib/call-context"


const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Sriram's CRM - An CRM Built By Axion Technologies",
  description:
    "Professional CRM for real estate lead management and sales tracking",
  generator: "Axion",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg" },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

function GlobalCallUI() {
  const { callState, setCallState } = useCall()

  if (!callState.isOpen || !callState.lead) return null

  return (
    <FloatingCallWidget
      contactName={callState.lead.name}
      contactPhone={callState.lead.phone}
      onClose={() => setCallState({ isOpen: false, lead: null })}
    />
  )
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SessionProvider>
            <AuthProvider>{children}</AuthProvider>
          </SessionProvider>
          <Toaster />  
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
