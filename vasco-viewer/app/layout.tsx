import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({ subsets: ["latin"], weight: ["300", "400"], variable: "--font-jost" });

export const metadata: Metadata = {
  title: "Vasco Viewer",
  description: "Veja e baixe as fotos de um perfil público do VSCO.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={jost.variable}>
      <body>{children}</body>
    </html>
  );
}
