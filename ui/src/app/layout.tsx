import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nobre CRM",
  description: "Gestão comercial de oportunidades da Nobre Brindes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-slate-50 text-slate-950">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
