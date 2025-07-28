"use client";

import { useState, useCallback, useRef, type ChangeEvent } from 'react';
import { findValidSharesAndReconstruct, type Share, type ShamirData } from '@/lib/shamir';

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
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  return (
    <div>
      <div>
        <h3>Upload Your Data</h3>
        <p>
          Select a JSON file containing the prime, k, and shares.
        </p>
      </div>
      <div>
        <input
          id="file-upload"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
        />
        {file && <p>Selected file: {file.name}</p>}
      </div>
      <div>
        <button onClick={handleReconstruct} disabled={!file || isLoading}>
          {isLoading ? 'Reconstructing...' : 'Reconstruct Secret'}
        </button>
        {error && (
          <div style={{ color: 'red', border: '1px solid red', padding: '10px', marginTop: '10px' }}>
            <h4>Error</h4>
            <p>{error}</p>
          </div>
        )}
      </div>

      {result && (
        <div style={{marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem'}}>
          <div>
            <h3>
              Reconstructed Secret
            </h3>
            <div style={{ background: '#f0f0f0', padding: '10px', fontFamily: 'monospace' }}>
              <p>{result.secret.toString()}</p>
              <button onClick={() => copyToClipboard(result.secret.toString())}>
                Copy
              </button>
            </div>
          </div>
          
          <div style={{display: 'flex', gap: '2rem', marginTop: '1rem'}}>
            <div>
              <h4>
                Valid Shares ({result.validShares.length})
              </h4>
              <ul style={{ background: '#f0f0f0', padding: '10px', listStyle: 'none', maxHeight: '200px', overflowY: 'auto' }}>
                {result.validShares.map(share => (
                  <li key={share.x.toString()} style={{fontFamily: 'monospace', fontSize: '12px'}}>
                    <span>x={share.x.toString()},</span>
                    <span>y={share.y.toString()}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4>
                Invalid Shares ({result.invalidShares.length})
              </h4>
              {result.invalidShares.length > 0 ? (
                <ul style={{ background: '#f0f0f0', padding: '10px', listStyle: 'none', maxHeight: '200px', overflowY: 'auto' }}>
                  {result.invalidShares.map(share => (
                    <li key={share.x.toString()} style={{fontFamily: 'monospace', fontSize: '12px', color: 'red' }}>
                       <span>x={share.x.toString()},</span>
                       <span>y={share.y.toString()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p><i>No invalid shares were detected.</i></p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
