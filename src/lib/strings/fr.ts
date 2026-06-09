/**
 * Strings utilisateur en français.
 *
 * Stockées de manière centralisée et namespacées pour préparer une
 * éventuelle migration vers `next-intl` sans réécrire les composants.
 * Au moment de migrer : remplacer chaque `t.section.key` par
 * `useTranslations('section')('key')`.
 */
export const fr = {
  app: {
    name: "PhotoGrid",
    tagline: "Imprimez vos photos comme un pro",
    by: "par Ojicode",
  },
  welcome: {
    titleMain: "Plusieurs photos.",
    titleAccent: "Une seule page.",
    subtitle:
      "Composez votre grille, choisissez votre format, imprimez depuis votre navigateur.",
    cta: "Commencer",
    eyebrow: "Impression depuis le navigateur",
    bullets: {
      offline: { label: "Hors-ligne", hint: "PWA installable" },
      formats: { label: "A4 / A5 / Letter", hint: "4 formats prêts" },
      instant: { label: "Instantané", hint: "Aperçu live" },
    },
  },
  home: {
    title: "Mes photos",
    empty: {
      title: "Aucune photo sélectionnée",
      subtitle:
        "Ajoutez vos photos pour composer votre grille d'impression.",
      cta: "Ajouter des photos",
    },
    actions: {
      add: "Ajouter",
      preview: "Prévisualiser",
      printPreview: "Prévisualiser l'impression",
      clear: "Tout supprimer",
      clearConfirm: "Supprimer toutes les photos ?",
    },
    counter: (n: number) =>
      n === 0
        ? "Aucune photo"
        : n === 1
          ? "1 photo"
          : `${n} photos`,
    emptySlots: (n: number) =>
      n === 0
        ? "Page complète"
        : n === 1
          ? "1 emplacement libre"
          : `${n} emplacements libres`,
  },
  preview: {
    title: "Prévisualisation",
    subtitle: (photos: number, pages: number) =>
      pages > 1
        ? `${photos} photos · ${pages} pages`
        : `${photos === 1 ? "1 photo" : `${photos} photos`}`,
    empty: {
      title: "Aucune photo à afficher",
      subtitle: "Veuillez sélectionner des photos pour les prévisualiser.",
      back: "Retour",
    },
    print: "Imprimer",
    cancel: "Annuler",
    iosHint:
      "Sur iOS, ajoutez d'abord à l'écran d'accueil pour un meilleur rendu.",
    pagesLabel: (n: number) => (n > 1 ? `${n} pages` : "1 page"),
    pageSlots: (filled: number, total: number) =>
      `${filled} / ${total} emplacements`,
    sheet: {
      title: "Imprimer",
      multiPages: (pages: number) =>
        `Cette composition fera ${pages} pages.`,
      onePage: "Cette composition fera 1 page.",
      printerHint: "Choisissez votre imprimante à l'étape suivante.",
      cta: "Imprimer maintenant",
    },
    pageOf: (current: number, total: number) =>
      `Page ${current} / ${total}`,
    success: "Impression lancée avec succès",
    error: "Une erreur est survenue lors de l'impression",
  },
  config: {
    title: "Disposition",
    sections: {
      grid: "Grille",
      format: "Format",
      margins: "Marges",
      quality: "Qualité",
    },
    columns: "Colonnes",
    rows: "Lignes",
    spacing: "Espacement",
    spacingUnit: "mm",
    pageSize: "Format de page",
    orientation: {
      label: "Orientation",
      portrait: "Portrait",
      landscape: "Paysage",
    },
    fitMode: {
      label: "Cadrage",
      contain: "Contenu",
      cover: "Remplir",
      fill: "Étirer",
    },
    margins: {
      top: "Haut",
      right: "Droite",
      bottom: "Bas",
      left: "Gauche",
    },
    quality: {
      standard: "Standard",
      high: "Haute",
      max: "Maximum",
    },
    presets: "Préréglages",
  },
  settings: {
    title: "Réglages",
    sections: {
      appearance: "Apparence",
      about: "À propos",
    },
    theme: {
      label: "Thème",
      light: "Clair",
      dark: "Sombre",
      system: "Système",
    },
    install: "Installer l'application",
    version: (v: string) => `Version ${v}`,
    author: "Par Ojicode",
    appearance: {
      title: "Apparence",
      lede: "Personnalisez le thème et le confort visuel de PhotoGrid.",
    },
    about: {
      title: "À propos",
      lede: "Détails techniques et licences.",
      version: "Version",
      designedBy: "Conçu par",
      privacy: "100 % local",
      privacyLabel: "Confidentialité",
    },
  },
  errors: {
    permissionDenied:
      "L'accès à vos photos est nécessaire pour utiliser l'application.",
    fileTypeUnsupported: (name: string) =>
      `Format non supporté : ${name}. Préférez JPEG ou PNG.`,
    tooManyPhotos: (max: number) =>
      `Limite atteinte (${max} photos). Supprimez-en avant d'en ajouter d'autres.`,
    printFailed: "L'impression a échoué. Veuillez réessayer.",
    storageFull:
      "Stockage plein : cette photo ne sera pas conservée après fermeture. Supprimez-en pour libérer de l'espace.",
  },
} as const;

export type Strings = typeof fr;
