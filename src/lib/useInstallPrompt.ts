import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Capture l'événement `beforeinstallprompt` (Chrome/Edge/Android) pour
 * permettre un déclenchement manuel de l'install prompt depuis les
 * réglages de l'app.
 *
 * Sur iOS Safari, l'event n'existe pas : on retourne `available: false`
 * et l'UI doit afficher des instructions manuelles ("Ajouter à l'écran
 * d'accueil" depuis le menu Partager) si on veut être complet.
 *
 * Le hook ne déclenche rien automatiquement : c'est l'utilisateur qui
 * appelle `promptInstall()` au moment qui lui convient.
 */
export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Détection install déjà effectuée
    if (window.matchMedia?.("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<
    "accepted" | "dismissed" | "unavailable"
  > => {
    if (!event) return "unavailable";
    await event.prompt();
    const result = await event.userChoice;
    if (result.outcome === "accepted") setInstalled(true);
    setEvent(null);
    return result.outcome;
  };

  return {
    available: event !== null && !installed,
    installed,
    promptInstall,
  };
}
