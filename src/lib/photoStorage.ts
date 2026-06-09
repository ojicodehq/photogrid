/**
 * Persistance des photos dans IndexedDB.
 *
 * Pourquoi IndexedDB et pas localStorage : localStorage ne stocke que
 * des chaînes (~5 Mo) ; les photos sont des données binaires de plusieurs
 * Mo chacune. IndexedDB stocke des `Blob` nativement, sans base64, avec
 * un quota de l'ordre du Go.
 *
 * Modèle : un object store `photos` indexé par `id`. Chaque enregistrement
 * porte les octets (`blob`) + les métadonnées nécessaires à la
 * reconstruction d'un `PhotoType` au démarrage (la blob URL, elle, est
 * recréée à chaque chargement : une URL `blob:` n'a aucune valeur après
 * un reload).
 *
 * L'ordre d'affichage est conservé via un champ `order` strictement
 * croissant : l'app n'ajoute qu'en fin de liste (jamais d'insertion au
 * milieu), donc un simple compteur monotone suffit et survit aux
 * suppressions sans collision.
 *
 * Zéro dépendance externe (pas de wrapper npm) : surface supply-chain
 * nulle, cohérent avec une app 100 % locale et privacy-first.
 */

const DB_NAME = "photogrid";
const STORE = "photos";
const DB_VERSION = 1;

/** Enregistrement persisté : octets + métadonnées (tout sauf la blob URL). */
export type StoredPhoto = {
  id: string;
  blob: Blob;
  order: number;
  width: number;
  height: number;
  name?: string;
  type?: string;
  size?: number;
  exifOrientation?: number;
};

/** Données fournies par le caller ; `order` est attribué en interne. */
export type StorablePhoto = Omit<StoredPhoto, "order">;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Compteur d'ordre monotone. Amorcé à l'hydratation au max existant + 1,
 * puis incrémenté à chaque écriture. Garantit un `order` unique et
 * croissant sans relire la base.
 *
 * `orderReady` résout dès que l'amorçage a eu lieu (succès ou échec de
 * l'hydratation) : `putPhotos` l'attend pour ne jamais attribuer un
 * `order` faible avant de connaître le max existant. Sans ça, une photo
 * ajoutée juste après le démarrage entrerait en collision d'ordre.
 */
let orderSeq = 0;
let orderReadySignaled = false;
let signalOrderReady!: () => void;
const orderReady = new Promise<void>((resolve) => {
  signalOrderReady = () => {
    if (!orderReadySignaled) {
      orderReadySignaled = true;
      resolve();
    }
  };
});

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(req.error ?? new Error("Ouverture IndexedDB échouée"));
  });
}

function db(): Promise<IDBDatabase> {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

function store(mode: IDBTransactionMode, idb: IDBDatabase): IDBObjectStore {
  return idb.transaction(STORE, mode).objectStore(STORE);
}

function toPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Demande au navigateur un stockage non-évictable
 * (`navigator.storage.persist`). Sans ça, certains navigateurs (Safari
 * iOS notamment) peuvent purger IndexedDB après quelques jours d'inactivité.
 * Best-effort : renvoie `false` si l'API est absente ou refuse.
 */
export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Lit toutes les photos persistées, triées par ordre d'affichage, et
 * réamorce le compteur d'ordre. À appeler une fois au démarrage.
 */
export async function getAllStoredPhotos(): Promise<StoredPhoto[]> {
  try {
    const all = await toPromise(
      store("readonly", await db()).getAll() as IDBRequest<StoredPhoto[]>,
    );
    all.sort((a, b) => a.order - b.order);
    // `orderSeq` comme plancher : ne jamais l'abaisser si `putPhotos` l'a
    // déjà avancé (écriture concurrente avant la fin de l'hydratation).
    orderSeq = all.reduce((max, r) => Math.max(max, r.order + 1), orderSeq);
    return all;
  } finally {
    // Même en cas d'échec : on débloque `putPhotos` (qui repartira de
    // `orderSeq` courant) plutôt que de le faire attendre indéfiniment.
    signalOrderReady();
  }
}

/**
 * Écrit un lot de photos dans une seule transaction. Attribue à chacune
 * un `order` croissant. Peut rejeter avec un `QuotaExceededError` si le
 * stockage est saturé : le caller doit le gérer (toast, dégradation).
 */
export async function putPhotos(items: StorablePhoto[]): Promise<void> {
  if (items.length === 0) return;
  // Attendre l'amorçage du compteur d'ordre avant d'attribuer les `order`
  // (évite une collision si l'ajout précède la fin de l'hydratation).
  await orderReady;
  const records: StoredPhoto[] = items.map((it) => ({
    ...it,
    order: orderSeq++,
  }));
  const objStore = store("readwrite", await db());
  await Promise.all(records.map((r) => toPromise(objStore.put(r))));
}

/** Supprime une photo par son `id`. */
export async function deletePhoto(id: string): Promise<void> {
  await toPromise(store("readwrite", await db()).delete(id));
}

/** Vide complètement le stockage des photos. */
export async function clearStoredPhotos(): Promise<void> {
  await toPromise(store("readwrite", await db()).clear());
}
