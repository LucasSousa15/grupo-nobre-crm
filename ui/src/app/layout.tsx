import type { Metadata } from "next";
import { ToastProvider } from "@/components/toast-provider";
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
      <body className="min-h-full bg-nobre-paper text-nobre-forest-deep">
        <QueryProvider>
          {children}
          <ToastProvider />
        </QueryProvider>
      </body>
    </html>
  );
}
