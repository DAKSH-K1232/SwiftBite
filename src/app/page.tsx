import ShamirReconstructor from '@/components/shamir-reconstructor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FlameKindling, HelpCircle } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-primary/10 p-3 rounded-full mb-4 border border-primary/20">
                <FlameKindling className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-headline text-foreground">
              Shamir's Sentinel
            </h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-xl">
              Upload your Shamir's Secret Sharing JSON file to reconstruct the original secret, even with potentially invalid shares.
            </p>
        </div>

        <ShamirReconstructor />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-accent" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              This tool helps you securely reconstruct a secret that has been split into multiple pieces or "shares" using an algorithm called <strong>Shamir's Secret Sharing</strong>.
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>Reconstructs Secrets:</strong> It takes a set of shares and combines them to reveal the original secret data.
              </li>
              <li>
                <strong>Error Correction:</strong> You don't need all the shares. If you have enough valid shares (reaching the "threshold"), the secret can be recovered even if other shares are lost or corrupted.
              </li>
              <li>
                <strong>Secure &amp; Private:</strong> All calculations happen directly in your browser. Your secret data is never uploaded to a server.
              </li>
            </ul>
          </CardContent>
        </Card>

        <footer className="text-center mt-8 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Shamir's Sentinel. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
