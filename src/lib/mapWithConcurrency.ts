/**
 * Applique `fn` à chaque élément avec au plus `limit` exécutions
 * simultanées. Préserve l'ordre des résultats (indexé sur l'entrée), pas
 * l'ordre d'achèvement. Une rejection se propage, comme `Promise.all`.
 *
 * Utilisé pour borner les traitements mémoire-intensifs par lot (décodage
 * d'images, fetch de blobs) : un `Promise.all` non borné sur 80 photos HD
 * peut saturer la RAM d'une WebView mobile et tuer l'onglet.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    },
  );
  await Promise.all(workers);
  return results;
}
