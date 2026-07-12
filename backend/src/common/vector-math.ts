/**
 * Computes the cosine similarity between two numeric vectors,
 * with an optional weights vector to scale specific dimensions.
 * Returns a value between 0.0 and 1.0 (assuming non-negative components).
 */
export function cosineSimilarity(
  vecA: number[],
  vecB: number[],
  weights?: number[]
): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must be of the same length');
  }

  let dotProduct = 0;
  let normASquared = 0;
  let normBSquared = 0;

  for (let i = 0; i < vecA.length; i++) {
    const w = weights ? weights[i] : 1;
    const aVal = vecA[i] * w;
    const bVal = vecB[i] * w;

    dotProduct += aVal * bVal;
    normASquared += aVal * aVal;
    normBSquared += bVal * bVal;
  }

  if (normASquared === 0 || normBSquared === 0) {
    return 0;
  }

  const similarity = dotProduct / (Math.sqrt(normASquared) * Math.sqrt(normBSquared));
  // Round to 4 decimal places
  return Math.round(similarity * 10000) / 10000;
}
