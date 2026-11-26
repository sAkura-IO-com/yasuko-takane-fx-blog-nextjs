import localFont from "next/font/local";

export const fxUiFont = localFont({
  src: "./fonts/jingnan-round-full.woff2",
  variable: "--font-fx-ui",
  weight: "400",
  display: "swap",
  preload: true,
});

export const fxArticleFont = localFont({
  src: "./fonts/AP.woff2",
  variable: "--font-fx-body",
  weight: "100",
  display: "swap",
  preload: false,
});

export const fxDecoFont = localFont({
  src: "./fonts/rounded-mplus-1m-medium.woff2",
  variable: "--font-fx-deco",
  weight: "500",
  display: "swap",
  preload: true,
});

export const fxMonoFont = localFont({
  src: [
    {
      path: "./fonts/jetbrains-mono-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/jetbrains-mono-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-fx-mono",
  display: "swap",
  preload: false,
});
