import type { ReactNode } from "react";

export const metadata = {
  title: "Galley",
  description: "Booking product foundation",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
