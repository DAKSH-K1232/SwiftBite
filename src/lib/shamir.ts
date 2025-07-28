
export interface Share {
  x: number;
  y: string;
}

export interface ShamirData {
  prime: string;
  k: number;
  shares: Share[];
}

function egcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (a === 0n) {
    return [b, 0n, 1n];
  }
  const [g, y, x] = egcd(b % a, a);
  return [g, x - (b / a) * y, y];
}

function modInverse(a: bigint, m: bigint): bigint {
  if (m < 0) m = -m;
  let [g, x] = egcd(a, m);
  if (g !== 1n) {
    throw new Error(`Modular inverse does not exist for ${a} mod ${m}. This should not happen with a prime modulus.`);
  }
  return (x % m + m) % m;
}

function lagrangeInterpolate(shares: Share[], prime: bigint): bigint {
  let secret = 0n;

  for (let i = 0; i < shares.length; i++) {
    const { x: xi, y: yiStr } = shares[i];
    const yi = BigInt(yiStr);
    let numerator = 1n;
    let denominator = 1n;

    for (let j = 0; j < shares.length; j++) {
      if (i === j) continue;
      const { x: xj } = shares[j];
      numerator = (numerator * (0n - BigInt(xj))) % prime;
      let term = BigInt(xi) - BigInt(xj);
      denominator = (denominator * term) % prime;
    }
    
    // Ensure denominator is positive before taking inverse
    const positiveDenominator = (denominator % prime + prime) % prime;
    const invDenominator = modInverse(positiveDenominator, prime);
    const lagrangePolynomial = (yi * numerator * invDenominator);
    secret = (secret + lagrangePolynomial);
  }

  return (secret % prime + prime) % prime;
}


function findValidSharesAndReconstruct(data: ShamirData) {
  if (!data || typeof data !== 'object') {
    return { error: 'Invalid data format. Expected a JSON object.' };
  }
  
  const { prime, k, shares } = data;

  if (typeof prime !== 'string' || prime.trim() === '') {
    return { error: 'Invalid or missing "prime" in JSON file.' };
  }
  if (typeof k !== 'number' || !Number.isInteger(k) || k <= 0) {
    return { error: 'Invalid or missing "k" in JSON file. It must be a positive integer.' };
  }
  if (!Array.isArray(shares)) {
    return { error: 'Invalid or missing "shares" array in JSON file.' };
  }
  
  const primeBigInt = BigInt(prime);

  if (shares.length < k) {
    return { error: `Not enough shares to reconstruct. Need ${k}, got ${shares.length}.` };
  }

  function getCombinations<T>(array: T[], size: number): T[][] {
    if (size === 0) return [[]];
    if (array.length < size) return [];
    if (array.length === 0) return [];

    const [first, ...rest] = array;
    const combsWithFirst = getCombinations(rest, size - 1).map(comb => [first, ...comb]);
    const combsWithoutFirst = getCombinations(rest, size);

    return [...combsWithFirst, ...combsWithoutFirst];
  }

  const shareCombinations = getCombinations(shares, k);

  for (const combination of shareCombinations) {
    try {
      const potentialSecret = lagrangeInterpolate(combination, primeBigInt);
      let consistentShares = combination.slice();

      for (const share of shares) {
        if (consistentShares.some(s => s.x === share.x)) continue;
        if (!share.y) continue; // Skip shares with missing y

        const reconstructedY = evaluatePolynomial(consistentShares, primeBigInt, share.x);
        if (BigInt(share.y) === reconstructedY) {
          consistentShares.push(share);
        }
      }

      if (consistentShares.length >= k) {
        const invalidShares = shares.filter(s => !consistentShares.some(cs => cs.x === s.x));
        return { secret: potentialSecret, invalidShares: invalidShares };
      }
    } catch (e: any) {
      console.error("Error during interpolation:", e.message);
      // Continue to the next combination
    }
  }

  return { error: 'Could not find a consistent set of k shares to reconstruct the secret.' };
}

function evaluatePolynomial(shares: Share[], prime: bigint, atX: number): bigint {
  let result = 0n;
  const atXBigInt = BigInt(atX);

  for (let i = 0; i < shares.length; i++) {
    const { x: xi, y: yiStr } = shares[i];
    if (!yiStr) continue; // Skip if y is missing
    const yi = BigInt(yiStr);
    let term = yi;

    for (let j = 0; j < shares.length; j++) {
      if (i === j) continue;
      const { x: xj } = shares[j];

      const numerator = (atXBigInt - BigInt(xj));
      const denominator = (BigInt(xi) - BigInt(xj));

      // Ensure we don't divide by zero if two x values are the same in the combination
      if (denominator === 0n) {
          throw new Error("Duplicate x values in shares combination.");
      }
      
      const positiveDenominator = (denominator % prime + prime) % prime;
      term = (term * numerator * modInverse(positiveDenominator, prime));
    }
    result = (result + term);
  }

  return (result % prime + prime) % prime;
}

export { findValidSharesAndReconstruct };
