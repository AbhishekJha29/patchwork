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
      <body className="antialiased bg-[#090d16] text-slate-100 selection:bg-cyan-500 selection:text-black">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
