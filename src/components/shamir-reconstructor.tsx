"use client";

import { useState, useCallback, useRef, type ChangeEvent } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { findValidSharesAndReconstruct, type Share, type ShamirData } from '@/lib/shamir';
import { CheckCircle, Copy, FileUp, KeyRound, Loader2, ShieldAlert, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResultState {
  secret: bigint;
  validShares: Share[];
  invalidShares: Share[];
}

export default function ShamirReconstructor() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/json') {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError("Invalid file type. Please upload a JSON file.");
        setFile(null);
      }
    }
  };

  const handleReconstruct = useCallback(async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const fileContent = await file.text();
      const data: ShamirData = JSON.parse(fileContent);

      if (!data.prime || !data.k || !data.shares) {
        throw new Error("Invalid JSON structure. It must contain 'prime', 'k', and 'shares'.");
      }
      if (typeof data.k !== 'number') {
        throw new Error("'k' must be a number.");
      }
      if (!Array.isArray(data.shares)) {
        throw new Error("'shares' must be an array.");
      }

      const prime = BigInt(data.prime);
      const k = data.k;
      const allShares: Share[] = data.shares.map(s => ({
        x: BigInt(s.x),
        y: BigInt(s.y),
      }));

      const reconstructionResult = findValidSharesAndReconstruct(allShares, k, prime);

      if (reconstructionResult.error) {
        throw new Error(reconstructionResult.error);
      }
      
      if(reconstructionResult.secret !== undefined && reconstructionResult.validShares) {
        setResult({
            secret: reconstructionResult.secret,
            validShares: reconstructionResult.validShares,
            invalidShares: reconstructionResult.invalidShares || [],
        });
      }

    } catch (e: any) {
      setError(e.message || "An unknown error occurred during reconstruction.");
    } finally {
      setIsLoading(false);
    }
  }, [file]);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: "The secret has been copied to your clipboard.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-6 w-6" />
          Upload Your Data
        </CardTitle>
        <CardDescription>
          Select a JSON file containing the prime, k, and shares.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          id="file-upload"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="cursor-pointer file:cursor-pointer file:text-primary file:font-semibold"
        />
        {file && <p className="text-sm text-muted-foreground">Selected file: {file.name}</p>}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-4">
        <Button onClick={handleReconstruct} disabled={!file || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reconstructing...
            </>
          ) : (
            'Reconstruct Secret'
          )}
        </Button>
        {error && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardFooter>

      {result && (
        <CardContent className="mt-6 border-t pt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-headline font-semibold flex items-center gap-2">
              <KeyRound className="h-6 w-6 text-accent" />
              Reconstructed Secret
            </h3>
            <div className="p-4 bg-secondary rounded-lg font-mono text-sm break-all relative group">
              <p>{result.secret.toString()}</p>
              <Button 
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(result.secret.toString())}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                Valid Shares ({result.validShares.length})
              </h4>
              <ul className="p-3 bg-secondary/50 rounded-lg space-y-2 max-h-48 overflow-y-auto">
                {result.validShares.map(share => (
                  <li key={share.x.toString()} className="font-mono text-xs flex gap-2">
                    <span className="text-muted-foreground">x={share.x.toString()},</span>
                    <span>y={share.y.toString()}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                Invalid Shares ({result.invalidShares.length})
              </h4>
              {result.invalidShares.length > 0 ? (
                <ul className="p-3 bg-secondary/50 rounded-lg space-y-2 max-h-48 overflow-y-auto">
                  {result.invalidShares.map(share => (
                    <li key={share.x.toString()} className="font-mono text-xs flex gap-2 text-destructive/80">
                       <span className="text-muted-foreground">x={share.x.toString()},</span>
                       <span>y={share.y.toString()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No invalid shares were detected.</p>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
