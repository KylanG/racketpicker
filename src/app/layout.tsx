import "./globals.css";

// <html> and <body> live in [locale]/layout.tsx so `lang` matches the market.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return children;
}
