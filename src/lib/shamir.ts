
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
  const [g, x] = egcd(a, m);
  if (g !== 1n) {
    throw new Error('Modular inverse does not exist');
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

    const invDenominator = modInverse(denominator, prime);
    const lagrangePolynomial = (yi * numerator * invDenominator);
    secret = (secret + lagrangePolynomial) % prime;
  }

  return (secret + prime) % prime;
}

function findValidSharesAndReconstruct(data: ShamirData) {
  const { prime, k, shares } = data;
  const primeBigInt = BigInt(prime);

  if (shares.length < k) {
    return { error: `Not enough shares to reconstruct. Need ${k}, got ${shares.length}.` };
  }

  function getCombinations<T>(array: T[], size: number): T[][] {
    if (size === 0) return [[]];
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

        const reconstructedY = evaluatePolynomial(consistentShares, primeBigInt, share.x);
        if (BigInt(share.y) === reconstructedY) {
          consistentShares.push(share);
        }
      }

      if (consistentShares.length >= k) {
        const invalidShares = shares.filter(s => !consistentShares.some(cs => cs.x === s.x));
        return { secret: potentialSecret, invalidShares: invalidShares };
      }
    } catch (e) {
      continue;
    }
  }

  return { error: 'Could not find a consistent set of k shares to reconstruct the secret.' };
}

function evaluatePolynomial(shares: Share[], prime: bigint, atX: number): bigint {
  let result = 0n;
  const atXBigInt = BigInt(atX);

  for (let i = 0; i < shares.length; i++) {
    const { x: xi, y: yiStr } = shares[i];
    const yi = BigInt(yiStr);
    let term = yi;

    for (let j = 0; j < shares.length; j++) {
      if (i === j) continue;
      const { x: xj } = shares[j];

      const numerator = (atXBigInt - BigInt(xj));
      const denominator = (BigInt(xi) - BigInt(xj));
      term = (term * numerator * modInverse(denominator, prime));
    }
    result = (result + term);
  }

  return (result % prime + prime) % prime;
}

export { findValidSharesAndReconstruct };
