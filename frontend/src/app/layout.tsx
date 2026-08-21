import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ProjectProvider } from "../context/ProjectContext";
import Sidebar from "../components/layout/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeAtlas Control Center — Code Intelligence & Architecture Engine",
  description: "Local-first code intelligence and structural context engine for developers and AI agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${inter.variable} ${robotoMono.variable} bg-slate-950 text-slate-100 antialiased font-sans flex h-screen overflow-hidden`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ProjectProvider>
            <Sidebar />
            <main className="flex-1 h-full overflow-y-auto bg-slate-950 text-slate-100 relative flex flex-col">
              {children}
            </main>
          </ProjectProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
