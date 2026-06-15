/**
 * Applique `fn` à chaque élément avec au plus `limit` exécutions
 * simultanées. Préserve l'ordre des résultats (indexé sur l'entrée), pas
 * l'ordre d'achèvement. Une rejection se propage, comme `Promise.all`.
 *
 * Utilisé pour borner les traitements mémoire-intensifs par lot (décodage
 * d'images, fetch de blobs) : un `Promise.all` non borné sur 100 photos HD
 * peut saturer la RAM d'une WebView mobile et tuer l'onglet.
 *
 * `onProgress` (optionnel) est appelé après chaque élément traité, avec le
 * nombre d'éléments terminés et le total : utile pour alimenter une barre
 * ou un compteur de progression.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  onProgress?: (completed: number, total: number) => void,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  let completed = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
        completed += 1;
        onProgress?.(completed, items.length);
      }
    },
  );
  await Promise.all(workers);
  return results;
}
