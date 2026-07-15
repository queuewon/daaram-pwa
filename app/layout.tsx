import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerCleanup } from "./register-sw";
import { BottomTabBar } from "./BottomTabBar";

export const metadata: Metadata = {
  title: "다아람",
  description: "젤라또 레시피·원가·오늘생산 관리",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ServiceWorkerCleanup />
        {children}
        <BottomTabBar />
      </body>
    </html>
  );
}
