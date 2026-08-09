import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Patchwork | AI Incident Response Platform",
  description: "Automated root cause analysis and patch generation for cloud infrastructure and microservices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#08090a] text-[#c9d1d9] font-mono selection:bg-[#10b981]/30 selection:text-[#34d399]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
