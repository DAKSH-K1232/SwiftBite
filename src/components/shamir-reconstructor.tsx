"use client";

import { useState, useCallback, useRef, type ChangeEvent } from 'react';
import { findValidSharesAndReconstruct, type Share, type ShamirData } from '@/lib/shamir';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, KeyRound, CheckCircle, XCircle, Copy } from 'lucide-react';

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
      
      const reconstructionResult = findValidSharesAndReconstruct(data);

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
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 font-body">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
             <div className="bg-primary p-3 rounded-full">
                <KeyRound className="text-primary-foreground" size={24} />
             </div>
             <div>
                <CardTitle className="font-headline text-3xl">Hashira</CardTitle>
                <CardDescription>Reconstruct secrets with confidence using Shamir's Secret Sharing.</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                />
                 <Button onClick={triggerFileSelect} variant="outline" className="w-full">
                    <Upload className="mr-2" />
                    {file ? `Selected: ${file.name}`: "Upload JSON File"}
                </Button>
            </div>
            
            <Button onClick={handleReconstruct} disabled={!file || isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                {isLoading ? 'Reconstructing...' : 'Reconstruct Secret'}
            </Button>
            
            {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
            )}
        </CardContent>

        {result && (
        <CardFooter className="flex flex-col items-start gap-6 pt-6 border-t">
          <div className="w-full">
            <h3 className="font-headline text-xl mb-2">
              Reconstructed Secret
            </h3>
            <div className="bg-muted p-4 rounded-md font-code break-all relative group">
              <p>{result.secret.toString()}</p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(result.secret.toString())}>
                <Copy size={16}/>
              </Button>
            </div>
          </div>
          
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-headline text-lg mb-2 flex items-center">
                <CheckCircle className="text-green-500 mr-2"/>
                Valid Shares ({result.validShares.length})
              </h4>
              <ScrollArea className="h-48 w-full bg-muted rounded-md p-2">
                <ul className="space-y-1">
                  {result.validShares.map(share => (
                    <li key={share.x.toString()} className="font-code text-sm p-2 rounded bg-background">
                      <span>x={share.x.toString()}, </span>
                      <span className="break-all">y={share.y.toString()}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
            <div>
              <h4 className="font-headline text-lg mb-2 flex items-center">
                 <XCircle className="text-red-500 mr-2"/>
                Invalid Shares ({result.invalidShares.length})
              </h4>
              <ScrollArea className="h-48 w-full bg-muted rounded-md p-2">
              {result.invalidShares.length > 0 ? (
                  <ul className="space-y-1">
                    {result.invalidShares.map(share => (
                      <li key={share.x.toString()} className="font-code text-sm p-2 rounded bg-background text-destructive">
                         <span>x={share.x.toString()}, </span>
                         <span className="break-all">y={share.y.toString()}</span>
                      </li>
                    ))}
                  </ul>
              ) : (
                <p className="p-2 italic text-muted-foreground">No invalid shares detected.</p>
              )}
              </ScrollArea>
            </div>
          </div>
        </CardFooter>
        )}
      </Card>
       <Toaster />
    </div>
  );
}

// Dummy components to avoid breaking the UI
import { Toaster } from "@/components/ui/toaster";
import { ScrollArea } from "@/components/ui/scroll-area";