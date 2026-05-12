import "./globals.css";
import AppShell from "../components/layout/AppShell";

export default function RootLayout({ children }: any) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-100">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}