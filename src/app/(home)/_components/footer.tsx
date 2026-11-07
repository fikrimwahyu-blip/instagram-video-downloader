import React from "react";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("layouts.home.footer");

  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-violet-50/70 py-6 md:py-0 dark:bg-gray-900">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:h-16 md:flex-row md:px-6">
        <p className="text-muted-foreground text-sm">
          {t("copyright", { year })}
        </p>
        <div className="flex gap-4">
          <a
            href="#"
            className="text-muted-foreground text-sm hover:text-violet-600"
          >
            {t("links.terms")}
          </a>
          <a
            href="#"
            className="text-muted-foreground text-sm hover:text-violet-600"
          >
            {t("links.privacy")}
          </a>
          <a
            href="#"
            className="text-muted-foreground text-sm hover:text-violet-600"
          >
            {t("links.contact")}
          </a>
        </div>
      </div>
    </footer>
  );
}
