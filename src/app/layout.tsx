import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoreVault | Enterprise Finance, Multi-Tenant Workspaces & Cloud Asset Vault",
  description: "Unified enterprise finance ledger, partner settlements, SaaS subscription tracker, and multi-tenant S3-backed document vault with zero-loss cloud database persistence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
