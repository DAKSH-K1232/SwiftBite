"use client";

import { useState, useCallback } from 'react';
import { reconstructSecret, type ShamirData } from '@/lib/shamir';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, KeyRound, Copy } from 'lucide-react';
import { Toaster } from "@/components/ui/toaster";

interface ResultState {
  fileName: string;
  secret: bigint;
}

export default function ShamirReconstructor() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [results, setResults] = useState<ResultState[]>([]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setErrors(["Please select one or more JSON files."]);
      return;
    }

    setIsLoading(true);
    setErrors([]);
    setResults([]);

    const newResults: ResultState[] = [];
    const newErrors: string[] = [];

    for (const file of Array.from(files)) {
      if (file.type !== 'application/json') {
        newErrors.push(`Skipped ${file.name}: Invalid file type. Please upload JSON files only.`);
        continue;
      }
      
      try {
        const fileContent = await file.text();
        const data: ShamirData = JSON.parse(fileContent);
        
        const reconstructionResult = reconstructSecret(data);

        if (reconstructionResult.error) {
          throw new Error(`Error in ${file.name}: ${reconstructionResult.error}`);
        }
        
        if (reconstructionResult.secret !== undefined) {
          newResults.push({
            fileName: file.name,
            secret: reconstructionResult.secret,
          });
        }
      } catch (err: any) {
        newErrors.push(err.message || `An unknown error occurred while processing ${file.name}.`);
      }
    }

    setResults(newResults);
    setErrors(newErrors);
    setIsLoading(false);
    
    // Clear the file input so the same files can be re-uploaded if needed
    e.target.value = '';

  }, []);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

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
            <div className="text-center">
                <Button asChild variant="outline" className="relative cursor-pointer w-full">
                  <div>
                    <Upload className="mr-2" />
                    <span>{isLoading ? 'Processing...' : 'Upload JSON File(s)'}</span>
                    <Input
                        id="file-upload"
                        type="file"
                        onChange={handleFileChange}
                        accept=".json"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isLoading}
                    />
                  </div>
                </Button>
            </div>
            
            {errors.length > 0 && (
              <div className="space-y-2">
                {errors.map((error, index) => (
                   <Alert key={index} variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
        </CardContent>

        {results.length > 0 && (
        <CardContent className="flex flex-col items-start gap-6 pt-6 border-t">
          {results.map((result, index) => (
            <div key={index} className="w-full">
              <h3 className="font-headline text-xl mb-2">
                Reconstructed Secret for <span className="font-bold">{result.fileName}</span>
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
          ))}
        </CardContent>
        )}
      </Card>
       <Toaster />
    </div>
  );
}