import type { Metadata } from "next";
import { Questrial } from "next/font/google";
import Providers from "@/app/providers";
import "./globals.css";

const questrial = Questrial({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-questrial",
});

export const metadata: Metadata = {
  title: "Econolab",
  description: "Laboratorio de análisis clínicos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${questrial.className} min-h-screen bg-slate-100 text-gray-900 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
