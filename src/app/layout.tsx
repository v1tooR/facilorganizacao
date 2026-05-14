import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Organização Fácil — Centro Operacional",
  description:
    "Centralize sua vida e trabalho em um sistema leve, claro e modular. Tarefas, finanças, projetos e anotações em um só lugar.",
  keywords: "organização, produtividade, tarefas, finanças, projetos, SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} h-full`}>
      <body className="min-h-full" style={{ fontFamily: "DM Sans, sans-serif" }} suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
