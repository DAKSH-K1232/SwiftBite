import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Shamir's Sentinel",
  description: "Reconstruct secrets with confidence using Shamir's Secret Sharing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
