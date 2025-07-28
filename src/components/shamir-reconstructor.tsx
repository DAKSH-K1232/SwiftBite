
"use client";

import { useState } from 'react';
import { findValidSharesAndReconstruct, type ShamirData, type Share } from '@/lib/shamir';

export default function ShamirReconstructor() {
  const [file, setFile] = useState<File | null>(null);
  const [secret, setSecret] = useState<bigint | null>(null);
  const [invalidShares, setInvalidShares] = useState<Share[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setSecret(null);
      setInvalidShares([]);
      setError(null);
    }
  };

  const handleReconstruct = async () => {
    if (!file) {
      setError("Please upload a file first.");
      return;
    }
    setError(null);
    setSecret(null);
    setInvalidShares([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data: ShamirData = JSON.parse(text);

        const result = findValidSharesAndReconstruct(data);

        if (result.secret !== undefined) {
          setSecret(result.secret);
          setInvalidShares(result.invalidShares || []);
        } else {
          setError(result.error || "An unknown error occurred.");
        }
      } catch (err: any) {
        setError(`Failed to process file: ${err.message}`);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file.");
    };
    reader.readAsText(file);
  };

  const jsonFormat = `{
  "prime": "a_large_prime_number",
  "k": 3,
  "shares": [
    { "x": 1, "y": "share_value_1" },
    { "x": 2, "y": "share_value_2" },
    { "x": 3, "y": "share_value_3" }
  ]
}`;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3>Expected JSON file format:</h3>
        <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
          <code>{jsonFormat}</code>
        </pre>
      </div>

      <input type="file" accept=".json" onChange={handleFileChange} />
      
      <button 
        onClick={handleReconstruct} 
        style={{ marginLeft: '10px' }}
        disabled={!file}
      >
        Reconstruct Secret
      </button>

      {error && (
        <div style={{ marginTop: '20px', color: 'red' }}>
          <h2>Error</h2>
          <pre>{error}</pre>
        </div>
      )}

      {secret !== null && (
        <div style={{ marginTop: '20px' }}>
          <h2>Reconstructed Secret</h2>
          <pre style={{ background: '#f0f0f0', padding: '10px', wordWrap: 'break-word' }}>
            {secret.toString()}
          </pre>
        </div>
      )}

      {invalidShares.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2>Detected Invalid Shares</h2>
          <pre style={{ background: '#f0f0f0', padding: '10px' }}>
            {JSON.stringify(invalidShares, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
