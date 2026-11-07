import React from "react";

import { useTranslations } from "next-intl";

import { ArrowDown, BadgeCheck, Instagram, Sparkles, Zap } from "lucide-react";

import { homeLinks, homeSections } from "@/lib/constants";
import { InstagramForm } from "@/components/instagram-form";

export function Hero() {
  const t = useTranslations("pages.home.hero");

  return (
    <section
      id={homeSections.hero}
      className="relative isolate w-full scroll-mt-16 overflow-hidden bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 py-16 md:py-24 lg:py-28 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950/30"
    >
      <div className="pointer-events-none absolute -left-28 top-8 -z-10 h-72 w-72 rounded-full bg-fuchsia-300/30 blur-3xl dark:bg-fuchsia-500/10" />
      <div className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-80 w-80 rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-500/10" />

      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm backdrop-blur dark:border-violet-400/20 dark:bg-gray-900/70 dark:text-violet-200">
            <Sparkles className="h-4 w-4" />
            <span>Instagram Downloader • Gratis & Cepat</span>
          </div>

          <div className="max-w-4xl space-y-5 text-balance">
            <h1 className="text-4xl font-black tracking-tight text-gray-950 sm:text-5xl md:text-6xl lg:text-7xl dark:text-white">
              {t("title")}
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-8 text-gray-600 sm:text-lg md:text-xl dark:text-gray-300">
              {t("description")}
            </p>
          </div>

          <div className="mt-9 w-full max-w-3xl rounded-3xl border border-white/80 bg-white/85 p-3 shadow-[0_24px_80px_-28px_rgba(109,40,217,0.35)] backdrop-blur-xl sm:p-5 dark:border-white/10 dark:bg-gray-900/80">
            <InstagramForm className="mx-auto max-w-2xl" />
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-gray-500 sm:text-sm dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
                Tanpa login
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                Proses cepat
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Instagram className="h-4 w-4 text-fuchsia-500" />
                Postingan & Reels
              </span>
            </div>
          </div>

          <a
            href={homeLinks.howItWorks}
            className="mt-10 inline-flex flex-col items-center gap-2 text-sm font-semibold text-violet-700 transition hover:text-fuchsia-600 dark:text-violet-300"
          >
            <span>{t("learnMore")}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-200 bg-white/80 shadow-sm transition hover:-translate-y-1 dark:border-violet-400/20 dark:bg-gray-900/70">
              <ArrowDown className="h-4 w-4 animate-bounce" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
