import { ChevronLeft } from "lucide-react";
import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";

type Variant = "large-title" | "blurred-back";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  variant?: Variant;
  back?: { href?: string; label?: string };
  rightAction?: ReactNode;
  className?: string;
};

/**
 * Header de l'app, deux variantes :
 * - "large-title" : titre proéminent, sans fond
 * - "blurred-back" : barre fixe semi-transparente (backdrop-blur) avec flèche retour
 */
export function AppHeader({
  title,
  subtitle,
  variant = "large-title",
  back,
  rightAction,
  className,
}: AppHeaderProps) {
  const navigate = useNavigate();

  if (variant === "blurred-back") {
    return (
      <header
        className={cn(
          "sticky top-0 z-30 border-b border-border/60",
          "bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60",
          className,
        )}
      >
        <div className="flex h-12 items-center px-2">
          <div className="flex flex-1 items-center min-w-0">
            {back ? (
              back.href ? (
                <Link
                  to={back.href}
                  className="text-primary -ml-1 flex items-center gap-0.5 px-2 py-1 rounded-md hover:bg-secondary/60 active:bg-secondary"
                >
                  <ChevronLeft className="size-5" strokeWidth={2.5} />
                  <span className="text-[17px] font-normal">
                    {back.label ?? "Retour"}
                  </span>
                </Link>
              ) : (
                <button
                  onClick={() => navigate(-1)}
                  className="text-primary -ml-1 flex items-center gap-0.5 px-2 py-1 rounded-md hover:bg-secondary/60 active:bg-secondary"
                >
                  <ChevronLeft className="size-5" strokeWidth={2.5} />
                  <span className="text-[17px] font-normal">
                    {back.label ?? "Retour"}
                  </span>
                </button>
              )
            ) : null}
          </div>
          <div className="flex flex-col items-center text-center min-w-0 px-2">
            <span className="font-display text-[17px] font-bold tracking-tight leading-tight truncate max-w-[60vw]">
              {title}
            </span>
            {subtitle ? (
              <span className="text-[11px] text-muted-foreground leading-tight truncate max-w-[60vw]">
                {subtitle}
              </span>
            ) : null}
          </div>
          <div className="flex flex-1 justify-end">{rightAction}</div>
        </div>
      </header>
    );
  }

  // large-title
  return (
    <header
      className={cn(
        "pt-6 pb-3 px-5",
        className,
      )}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[34px] font-bold tracking-[-0.025em] leading-[1]">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-[15px] text-muted-foreground mt-1">{subtitle}</p>
          ) : null}
        </div>
        {rightAction ? <div className="shrink-0 pb-1">{rightAction}</div> : null}
      </div>
    </header>
  );
}
