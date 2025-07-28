"use client";

export interface Share {
  x: bigint;
  y: bigint;
}

export interface ShamirData {
  prime: string;
  k: number;
  shares: { x: number; y: string }[];
}

function egcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (a === 0n) {
    return [b, 0n, 1n];
  }
  const [g, y, x] = egcd(b % a, a);
  return [g, x - (b / a) * y, y];
}

function modInverse(a: bigint, m: bigint): bigint {
  const [g, x] = egcd(a, m);
  if (g !== 1n) {
    throw new Error(`Modular inverse does not exist for ${a} and ${m}. The prime may be incorrect or shares might be malformed.`);
  }
  return (x % m + m) % m;
}

function reconstructSecret(shares: Share[], prime: bigint): bigint {
  let secret = 0n;

  for (let i = 0; i < shares.length; i++) {
    const { x: xi, y: yi } = shares[i];
    let numerator = 1n;
    let denominator = 1n;

    for (let j = 0; j < shares.length; j++) {
      if (i === j) continue;
      const { x: xj } = shares[j];
      numerator = (numerator * xj) % prime;
      denominator = (denominator * (xj - xi)) % prime;
    }
    
    if (denominator === 0n) {
        throw new Error(`Cannot reconstruct with this set of shares, division by zero would occur. Check for duplicate x-coordinates.`);
    }

    const lagrangePolynomial = (numerator * modInverse(denominator, prime)) % prime;
    secret = (secret + yi * lagrangePolynomial) % prime;
  }

  return (secret + prime) % prime;
}

function getCombinations<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  function combine(startIndex: number, combination: T[]) {
    if (combination.length === size) {
      result.push([...combination]);
      return;
    }
    if (startIndex > array.length - (size - combination.length)) {
        return;
    }
    
    combination.push(array[startIndex]);
    combine(startIndex + 1, combination);
    combination.pop();

    combine(startIndex + 1, combination);
  }
  combine(0, []);
  return result;
}

function evaluatePolynomial(x: bigint, points: Share[], prime: bigint): bigint {
  let result = 0n;
  const k = points.length;

  for (let i = 0; i < k; i++) {
    const { x: xi, y: yi } = points[i];
    let term = yi;
    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      const { x: xj } = points[j];
      const numerator = (x - xj);
      const denominator = (xi - xj);
      term = (term * numerator * modInverse(denominator, prime)) % prime;
    }
    result = (result + term) % prime;
  }
  return (result + prime) % prime;
}

export function findValidSharesAndReconstruct(allShares: Share[], k: number, prime: bigint) {
  if (allShares.length < k) {
    return { error: `Not enough shares provided. Need at least ${k}, but got ${allShares.length}.` };
  }

  const uniqueShares = Array.from(new Map(allShares.map(item => [item.x, item])).values());
  
  if (uniqueShares.length < k) {
    return { error: `Not enough unique shares provided. Need at least ${k}, but got ${uniqueShares.length}.` };
  }

  const combinations = getCombinations(uniqueShares, k);

  for (const combo of combinations) {
    try {
        const secretCandidate = reconstructSecret(combo, prime);
      
        const consistentShares = [...combo];
        const otherShares = uniqueShares.filter(s => !combo.find(cs => cs.x === s.x));

        for (const otherShare of otherShares) {
            const predictedY = evaluatePolynomial(otherShare.x, combo, prime);
            if (predictedY === otherShare.y) {
                consistentShares.push(otherShare);
            }
        }

        if (consistentShares.length >= k) {
          const finalSecret = reconstructSecret(consistentShares.slice(0, k), prime);
          const invalidShares = uniqueShares.filter(s => !consistentShares.find(cs => cs.x === s.x));
          return { secret: finalSecret, validShares: consistentShares, invalidShares };
        }
    } catch(e) {
        console.warn("A combination of shares failed reconstruction, trying next one.", e);
    }
  }

  return { error: 'Could not find a consistent set of k shares to reconstruct the secret. The data might be corrupted or the prime incorrect.' };
}
