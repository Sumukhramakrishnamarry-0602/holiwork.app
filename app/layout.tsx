import "./globals.css";
import { PwaRegister } from "@/components/pwa/PwaRegister";

export const metadata = {
  title: "Holiwork",
  description: "AI-powered productivity command center",
  applicationName: "Holiwork",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Holiwork" },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}<PwaRegister /></body>
    </html>
  );
}
