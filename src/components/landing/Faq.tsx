import { useState } from "react";

import { Minus, Plus } from "lucide-react";

import { fr as t } from "@/lib/strings/fr";
import { cn } from "@/lib/utils";

/**
 * FAQ en accordéon. Les questions ciblent les requêtes réelles
 * (« imprimer plusieurs photos sur une feuille A4 »…) et alimentent
 * le schema FAQPage déclaré dans index.html.
 */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-[860px]">
        <p className="text-primary text-[13px] font-semibold tracking-[0.08em] uppercase">
          {t.landing.faq.eyebrow}
        </p>
        <h2 className="font-display mt-2 text-[clamp(1.8rem,4vw,2.4rem)] font-bold tracking-[-0.02em]">
          {t.landing.faq.title}
        </h2>

        <div className="border-border mt-8 border-t">
          {t.landing.faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="border-border border-b">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-display text-[17px] font-semibold">
                    {item.q}
                  </span>
                  <span className="text-primary shrink-0">
                    {isOpen ? (
                      <Minus className="size-5" />
                    ) : (
                      <Plus className="size-5" />
                    )}
                  </span>
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="text-muted-foreground pb-5 text-[15px] leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
