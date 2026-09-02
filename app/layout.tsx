import "./globals.css";

import { abar } from "@/lib/fonts";
import { AppProvider } from "@/providers/app-provider";

export const metadata = {
  title: "Funima",
  description: "Funima",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={abar.variable}>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
