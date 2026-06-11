import { lazy } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "@/AppShell";

// Pages en lazy : chaque route a son chunk, chargé au premier accès
// (puis servi depuis le cache Serwist). pdf-lib, exifr et les plugins
// Capacitor restent ainsi hors du bundle initial.
const WelcomePage = lazy(() => import("@/pages/WelcomePage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const PreviewPage = lazy(() => import("@/pages/PreviewPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));

/**
 * Routeur de l'application.
 *
 * `HashRouter` (URL en `/#/route`) est retenu volontairement : il
 * fonctionne sans aucun fallback SPA côté serveur, aussi bien sur le
 * déploiement web statique (nginx) que dans la WebView Capacitor.
 * Un rafraîchissement de page profonde ne renvoie jamais de
 * 404 et les assets relatifs (`base: "./"`) résolvent toujours depuis
 * la racine.
 */
export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/preview" element={<PreviewPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
