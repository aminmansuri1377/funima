import "./globals.css";

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
    <html
      lang="fa"
      dir="rtl"
    >
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}