import type { Metadata } from "next";
import { StudioProvider } from "@/components/studio/preferences";
import "./globals.css";
export const metadata: Metadata = {
  title: "Phoneme Studio · Classroom Activity Builder",
  description:
    "Create, preview and download phoneme Wordle and Word Search activities for speech pathology classrooms.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <StudioProvider>{children}</StudioProvider>
      </body>
    </html>
  );
}
