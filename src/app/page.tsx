import ShamirReconstructor from '@/components/shamir-reconstructor';
import { FlameKindling } from 'lucide-react';

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
        <footer className="text-center mt-8 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Shamir's Sentinel. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
