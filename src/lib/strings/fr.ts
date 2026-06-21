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
  update: {
    available: "Mise à jour disponible",
    version: (v: string) => `version ${v}`,
    restart: "Redémarrer",
    dismiss: "Ignorer",
  },
  welcome: {
    titleMain: "Plusieurs photos.",
    titleAccent: "Une seule page.",
    subtitle:
      "Composez votre grille, ajustez les marges, imprimez depuis le navigateur. Sans inscription.",
    cta: "Commencer",
    eyebrow: "Impression photo",
    bullets: {
      grid: { label: "Grilles personnalisables", hint: "jusqu'à 10×10" },
      formats: { label: "Formats A4, A5, Letter, Legal", hint: "" },
      quality: { label: "Impression nette", hint: "jusqu'à 300 PPI" },
    },
  },
  landing: {
    nav: {
      how: "Comment ça marche",
      formats: "Formats",
      faq: "FAQ",
    },
    how: {
      eyebrow: "Comment ça marche",
      title: "Imprimer plusieurs photos sur une feuille, en trois étapes",
      lead: "Aucun logiciel à installer, aucune photo envoyée sur un serveur. Tout se passe dans votre navigateur.",
      steps: [
        {
          n: "01",
          title: "Ajoutez vos photos",
          text: "Glissez vos images depuis votre téléphone ou votre ordinateur. Elles restent sur votre appareil.",
        },
        {
          n: "02",
          title: "Choisissez le format et la grille",
          text: "A4, A5, Letter ou Legal, en portrait ou paysage. Réglez les colonnes, les lignes, les marges et l'espacement.",
        },
        {
          n: "03",
          title: "Imprimez ou exportez en PDF",
          text: "La grille sort à l'échelle millimétrique exacte. Ce que vous voyez à l'écran correspond à ce qui sort de l'imprimante.",
        },
      ],
    },
    formats: {
      eyebrow: "Formats d'impression",
      title: "Quatre formats, à la taille réelle",
      lead: "Chaque format respecte ses dimensions exactes, pour une impression fidèle sans rognage surprise.",
      items: [
        { name: "A4", dim: "210 × 297 mm", ratio: 71 },
        { name: "A5", dim: "148 × 210 mm", ratio: 50 },
        { name: "Letter", dim: "216 × 279 mm", ratio: 77 },
        { name: "Legal", dim: "216 × 356 mm", ratio: 100 },
      ],
    },
    faq: {
      eyebrow: "Questions fréquentes",
      title: "Ce que les gens demandent",
      items: [
        {
          q: "Comment imprimer plusieurs photos sur une seule feuille A4 ?",
          a: "Ouvrez PhotoGrid, ajoutez vos photos, choisissez le format A4 puis réglez la grille (par exemple 2 colonnes sur 3 lignes pour 6 photos). Lancez l'impression ou exportez un PDF. Les photos sont placées à l'échelle exacte sur la page.",
        },
        {
          q: "Mes photos sont-elles envoyées sur un serveur ?",
          a: "Non. PhotoGrid fonctionne entièrement dans votre navigateur. Vos images ne quittent jamais votre appareil, et l'application marche même hors-ligne une fois installée.",
        },
        {
          q: "PhotoGrid est-il gratuit ?",
          a: "Oui, gratuit et sans inscription. Vous pouvez l'utiliser depuis le web ou l'installer comme application (PWA), ainsi qu'en application Android.",
        },
        {
          q: "Puis-je imprimer à une taille précise ?",
          a: "Oui. La composition est calculée en millimètres : la taille à l'écran correspond exactement à la taille imprimée, sans mise à l'échelle automatique de l'imprimante.",
        },
        {
          q: "Est-ce que ça marche sur téléphone ?",
          a: "Oui, l'interface est pensée pour le mobile. Vous pouvez aussi installer PhotoGrid sur l'écran d'accueil pour l'ouvrir comme une vraie application.",
        },
        {
          q: "Le code de PhotoGrid est-il ouvert ?",
          a: "Oui. PhotoGrid est open source, publié sous licence AGPL-3.0. Le code est consultable sur GitHub : vous pouvez vérifier par vous-même qu'aucune photo n'est envoyée sur un serveur.",
        },
      ],
    },
    footer: {
      tagline: "Une application Ojicode open source, 100 % hors-ligne et sans compte.",
      cta: "Composer ma première page",
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
    importing: (done: number, total: number) =>
      `Importation… ${done}/${total}`,
    imported: (n: number) =>
      n === 1 ? "1 photo ajoutée" : `${n} photos ajoutées`,
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
    printing: "Génération…",
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
      label: "Qualité",
      standard: "Standard",
      high: "Haute",
      max: "Maximum",
      hint: "Plus net à l'impression et au zoom, mais fichier plus lourd.",
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
  installPrompt: {
    android: {
      titleLead: "Gardez PhotoGrid",
      titleAccent: "à portée",
      body: "Installez l'app pour l'ouvrir en un geste, en plein écran et même sans connexion.",
      install: "Installer l'application",
      later: "Plus tard",
    },
    ios: {
      title: "Ajouter à l'écran d'accueil",
      body: "Quelques secondes pour ouvrir PhotoGrid comme une vraie app, hors-ligne.",
      steps: {
        share: { action: "Partager", hint: "dans la barre de Safari" },
        addToHome: { action: "Sur l'écran d'accueil", hint: "" },
        confirm: { action: "Ajouter", hint: "en haut à droite" },
      },
      later: "Plus tard",
    },
  },
  errors: {
    permissionDenied:
      "L'accès à vos photos est nécessaire pour utiliser l'application.",
    fileTypeUnsupported: (name: string) =>
      `Format non supporté : ${name}. Préférez JPEG ou PNG.`,
    importFailed: (name: string, reason: string) =>
      `Impossible d'ajouter ${name} (${reason}). Faites une capture d'écran et envoyez-la à contact@ojicode.fr.`,
    tooManyPhotos: (max: number) =>
      `Limite atteinte (${max} photos). Supprimez-en avant d'en ajouter d'autres.`,
    printFailed: "L'impression a échoué. Veuillez réessayer.",
    storageFull:
      "Stockage plein : cette photo ne sera pas conservée après fermeture. Supprimez-en pour libérer de l'espace.",
  },
} as const;

export type Strings = typeof fr;
