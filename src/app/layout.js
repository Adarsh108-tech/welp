import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Welp — Virtual Office for Remote Teams",
  description: "Simulated WFH workplace with real-time interactive desks, synchronized focus sprints, and team communication.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#fdfbf7] text-[#38080f] min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
