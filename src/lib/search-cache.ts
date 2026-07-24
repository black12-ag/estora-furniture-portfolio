import { products, type Product } from "./products";

/**
 * Tiny LRU-ish cache for live search suggestions.
 * Repeat queries (typing "so" -> "sof" -> back to "so") resolve instantly
 * with no re-scan of the product list.
 */
const MAX = 50;
const cache = new Map<string, Product[]>();

export function getSuggestions(query: string, limit = 6): Product[] {
  const key = query.trim().toLowerCase();
  if (!key) return [];
  const hit = cache.get(key);
  if (hit) {
    // refresh LRU position
    cache.delete(key);
    cache.set(key, hit);
    return hit.slice(0, limit);
  }
  const results = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(key) ||
        p.category.toLowerCase().includes(key) ||
        p.type.toLowerCase().includes(key),
    )
    .slice(0, limit);
  cache.set(key, results);
  if (cache.size > MAX) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  return results;
}

export function _clearSearchCache() {
  cache.clear();
}
