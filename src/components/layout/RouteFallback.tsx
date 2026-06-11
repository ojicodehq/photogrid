import { Loader2 } from "lucide-react";

/**
 * Fallback du `Suspense` enveloppant les routes lazy : un spinner sobre,
 * centré plein écran. Visible uniquement au premier chargement du chunk
 * d'une page (instantané ensuite, le chunk étant en cache).
 */
export function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
    </div>
  );
}
