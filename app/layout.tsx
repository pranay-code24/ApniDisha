import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const inter = Inter({subsets : ["latin"]});

export const metadata: Metadata = {
  title: "ApniDisha | AI Career Ecosystem",
  description: "Find your true passion with gamified, aptitude and ML-driven adaptive quizzes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#2563eb",
          colorBackground: "#111827",
          colorText: "white",
          colorInputBackground: "#1f2937",
          colorInputText: "white",
          borderRadius: "0.75rem",
        },
        elements: {
          card: "border border-gray-800 shadow-2xl shadow-blue-900/20",
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all",
          socialButtonsBlockButton: "border border-gray-700 hover:bg-gray-800 transition-all",
          headerTitle: "text-2xl font-extrabold text-blue-500",
          headerSubtitle: "text-gray-400",
        },
      }}
    >
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
