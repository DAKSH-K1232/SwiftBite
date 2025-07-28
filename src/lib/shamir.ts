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

// A standard 257-bit prime often used in cryptography.
// This is chosen to be larger than the 256-bit coefficients mentioned in the problem statement.
const PRIME = 2n**257n - 93557n;

function parseBigInt(value: string, base: number | string): bigint {
    const baseNum = typeof base === 'string' ? parseInt(base, 10) : base;
    if (isNaN(baseNum) || baseNum < 2 || baseNum > 36) {
        throw new Error(`Invalid base for BigInt conversion: ${base}`);
    }

    if (typeof value !== 'string') {
        throw new Error(`Invalid value for BigInt conversion: must be a string.`);
    }

    let result = 0n;
    for (let i = 0; i < value.length; i++) {
        const digit = parseInt(value[i], baseNum);
        if (isNaN(digit)) {
             throw new Error(`Value "${value}" contains invalid characters for base ${baseNum}`);
        }
        result = result * BigInt(baseNum) + BigInt(digit);
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
    throw new Error(`Modular inverse does not exist for ${a} mod ${m}. This should not happen with a prime modulus.`);
  }
  return (x % m + m) % m;
}

function lagrangeInterpolate(shares: Share[], prime: bigint): bigint {
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

export function reconstructSecret(data: ShamirData) {
    if (!data.keys || typeof data.keys.k !== 'number') {
        return { error: "Invalid JSON structure. It must contain 'keys' object with a numeric 'k' value." };
    }

    const { k } = data.keys;
    const allShares: Share[] = [];

    for (const key in data) {
        if (key !== "keys") {
            try {
                const x = BigInt(key);
                const { base, value } = data[key];
                if (base === undefined || value === undefined) {
                  throw new Error(`Share for key "${key}" is missing 'base' or 'value'.`);
                }
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
  
    // As per the problem, we use the first k shares to find the secret.
    const sharesToUse = allShares.slice(0, k);

    try {
        const secret = lagrangeInterpolate(sharesToUse, PRIME);
        return { secret };
    } catch(e: any) {
        return { error: `Could not reconstruct secret: ${e.message}` };
    }
}