import type { Metadata, Viewport } from "next";
import "@/styles.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Hyqoo — AI Talent Platform for Global Tech Hiring",
  description:
    "Build pre-vetted, high-performing global tech teams in days with Hyqoo’s AI talent platform and human expertise.",
  authors: [{ name: "Hyqoo" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Hyqoo — AI Talent Platform for Global Tech Hiring",
    description:
      "Build pre-vetted global tech teams in days with AI matching and real human judgment.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
