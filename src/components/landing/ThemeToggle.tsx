import { useEffect, useState } from "react";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { usePhotoGridStore } from "@/lib/store";

/**
 * Bascule clair / sombre pour la barre de navigation de la landing.
 * Reste cohérent avec les réglages de l'app : met à jour next-themes ET le
 * store persistant (même logique que SettingsPage).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme: setNextTheme } = useTheme();
  const setStoreTheme = usePhotoGridStore((s) => s.setTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Avant le montage, on réserve l'espace pour éviter tout décalage / flash.
  if (!mounted) {
    return <div className="size-9" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    setStoreTheme(next);
    setNextTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Passer en thème clair" : "Passer en thème sombre"}
      className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors"
    >
      {isDark ? (
        <Sun className="size-[18px]" strokeWidth={2} />
      ) : (
        <Moon className="size-[18px]" strokeWidth={2} />
      )}
    </button>
  );
}
