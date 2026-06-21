import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource-variable/dm-sans";
import "@fontsource-variable/outfit";
// Fraunces (italique) : police accent officielle Ojicode, réservée au titre
// du hero (« Une seule page. »). Variante wght-italic uniquement = léger.
import "@fontsource-variable/fraunces/wght-italic.css";
import "@/styles/globals.css";

import { initAnalytics } from "@/lib/analytics";
import { AppRouter } from "@/AppRouter";
import { registerServiceWorker } from "@/lib/registerSW";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Élément racine #root introuvable dans index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);

registerServiceWorker();
initAnalytics();
