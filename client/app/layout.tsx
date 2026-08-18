import type { Metadata } from "next";
import type { ReactNode } from "react";
import { UserProvider } from "@/components/UserProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mead Makers",
  description: "Track your mead batches and recipes",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
