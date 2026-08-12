import "./globals.css";

export const metadata = {
  title: "壁紙・CF数量計算",
  description: "現場で採寸して、その場で発注数量を出す",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
