import "./globals.css";

export const metadata = {
  title: "Holiwork",
  description: "AI-powered productivity command center",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
