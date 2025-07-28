export interface Share {
  x: bigint;
  y: bigint;
}

export interface ShamirData {
    keys: {
        n: number;
        k: number;
    };
    [key: string]: any;
}

function parseBigInt(value: string, base: number | string): bigint {
    const baseNum = typeof base === 'string' ? parseInt(base, 10) : base;
    if (isNaN(baseNum) || baseNum < 2 || baseNum > 36) {
        throw new Error(`Invalid base for BigInt conversion: ${base}`);
    }

    if (baseNum === 10) {
        return BigInt(value);
    }

    let result = 0n;
    let power = 1n;
    for (let i = value.length - 1; i >= 0; i--) {
        const digit = parseInt(value[i], baseNum);
        if (isNaN(digit)) {
             throw new Error(`Value "${value}" contains invalid characters for base ${baseNum}`);
        }
        result += BigInt(digit) * power;
        power *= BigInt(baseNum);
    }
    return result;
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
  const k = shares.length;

  for (let i = 0; i < k; i++) {
    const { x: xi, y: yi } = shares[i];
    let numerator = 1n;
    let denominator = 1n;

    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      const { x: xj } = shares[j];
      numerator = (numerator * (0n - xj)) % prime;
      denominator = (denominator * (xi - xj)) % prime;
    }
    
    if (denominator === 0n) {
        throw new Error(`Cannot reconstruct with this set of shares, division by zero would occur. Check for duplicate x-coordinates.`);
    }

    const lagrangePolynomial = (yi * numerator * modInverse(denominator, prime)) % prime;
    secret = (secret + lagrangePolynomial) % prime;
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
    if (startIndex >= array.length) {
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

export function findValidSharesAndReconstruct(data: ShamirData) {
    if (!data.keys || typeof data.keys.k !== 'number') {
        return { error: "Invalid JSON structure. It must contain 'keys' object with a numeric 'k' value." };
    }

    const { k } = data.keys;
    const prime = 257n; 

    const allShares: Share[] = [];
    for (const key in data) {
        if (key !== "keys") {
            try {
                const x = BigInt(key);
                const { base, value } = data[key];
                const y = parseBigInt(value, base);
                allShares.push({ x, y });
            } catch (e: any) {
                 return { error: `Failed to parse share for key "${key}": ${e.message}` };
            }
        }
    }

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
        // This combination failed, which is expected if it contains invalid shares.
        // We can ignore this and try the next combination.
    }
  }

  return { error: 'Could not find a consistent set of k shares to reconstruct the secret. The data might be corrupted or the prime incorrect.' };
}
