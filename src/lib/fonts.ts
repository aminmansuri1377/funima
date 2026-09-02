import localFont from "next/font/local";

export const abar = localFont({
  src: [
    {
      path: "../../public/font/Abar-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/font/Abar-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/font/Abar-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/font/Abar-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/font/Abar-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],

  variable: "--font-abar",
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});
