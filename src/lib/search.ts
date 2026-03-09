/**
 * Search utilities with fuzzy matching, accent normalization, and typo tolerance
 */

/**
 * Remove accents and diacritics from text (comédia → comedia)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^\w\s]/g, "") // Remove special characters
    .trim();
}

/**
 * Levenshtein distance - measures edit distance between two strings
 * Lower = more similar
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-1) between two strings
 * 1 = identical, 0 = completely different
 */
export function similarityScore(a: string, b: string): number {
  const normalizedA = normalizeText(a);
  const normalizedB = normalizeText(b);

  if (normalizedA === normalizedB) return 1;
  if (!normalizedA || !normalizedB) return 0;

  const maxLength = Math.max(normalizedA.length, normalizedB.length);
  const distance = levenshteinDistance(normalizedA, normalizedB);

  return 1 - distance / maxLength;
}

/**
 * Check if query matches target with typo tolerance
 * @param query - User's search query
 * @param target - Text to search in
 * @param threshold - Minimum similarity (0-1), default 0.7
 */
export function fuzzyMatch(query: string, target: string, threshold = 0.7): boolean {
  const normalizedQuery = normalizeText(query);
  const normalizedTarget = normalizeText(target);

  // Exact match (after normalization)
  if (normalizedTarget.includes(normalizedQuery)) {
    return true;
  }

  // Check each word in query against target
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
  const targetWords = normalizedTarget.split(/\s+/).filter(Boolean);

  // For short queries, check if any word fuzzy matches
  if (queryWords.length === 1 && queryWords[0].length >= 3) {
    for (const targetWord of targetWords) {
      if (similarityScore(queryWords[0], targetWord) >= threshold) {
        return true;
      }
    }
  }

  // For multi-word queries, check if most words match
  let matchedWords = 0;
  for (const qWord of queryWords) {
    const hasMatch =
      normalizedTarget.includes(qWord) ||
      targetWords.some((tWord) => similarityScore(qWord, tWord) >= threshold);
    if (hasMatch) matchedWords++;
  }

  return matchedWords >= Math.ceil(queryWords.length * 0.7);
}

/**
 * Search result with relevance score
 */
export interface SearchResult<T> {
  item: T;
  score: number;
  matches: {
    field: string;
    matched: boolean;
  }[];
}

/**
 * Perform fuzzy search on an array of items
 * @param items - Items to search
 * @param query - Search query
 * @param fields - Fields to search in each item
 * @param threshold - Minimum similarity threshold
 */
export function fuzzySearch<T extends Record<string, any>>(
  items: T[],
  query: string,
  fields: (keyof T)[],
  threshold = 0.6
): SearchResult<T>[] {
  if (!query.trim()) return [];

  const normalizedQuery = normalizeText(query);

  const results: SearchResult<T>[] = [];

  for (const item of items) {
    let totalScore = 0;
    const matches: { field: string; matched: boolean }[] = [];

    for (const field of fields) {
      const value = item[field];
      if (typeof value !== "string") continue;

      const normalizedValue = normalizeText(value);
      let fieldScore = 0;

      // Exact match (highest priority)
      if (normalizedValue.includes(normalizedQuery)) {
        fieldScore = 1;
      } else {
        // Fuzzy match
        const similarity = similarityScore(normalizedQuery, normalizedValue);
        if (similarity >= threshold) {
          fieldScore = similarity;
        } else if (fuzzyMatch(query, value, threshold)) {
          fieldScore = 0.5;
        }
      }

      matches.push({ field: field as string, matched: fieldScore > 0 });
      totalScore = Math.max(totalScore, fieldScore);
    }

    if (totalScore > 0) {
      results.push({ item, score: totalScore, matches });
    }
  }

  // Sort by score (highest first)
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Highlight matching parts of text
 */
export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;

  const normalizedQuery = normalizeText(query);
  const words = normalizedQuery.split(/\s+/).filter(Boolean);

  let result = text;
  for (const word of words) {
    const regex = new RegExp(`(${word})`, "gi");
    result = result.replace(regex, "<mark>$1</mark>");
  }

  return result;
}
