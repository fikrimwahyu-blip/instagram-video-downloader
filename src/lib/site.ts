import { Metadata } from "next";

export const siteConfig = {
  name: "Instagram Downloader",
  domain: "gram-grabberz.vercel.com",
  shortName: "Instagram Downloader",
  creator: "riad-azz",
  description:
    "Download video Instagram dengan cepat, gratis, dan tanpa perlu login.",
  ogDescription:
    "Download video Instagram dengan cepat, gratis, dan tanpa perlu login.",
  url: "https://gram-grabberz.vercel.com",
};

export const siteMetadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  creator: siteConfig.creator,
  openGraph: {
    type: "website",
    locale: "en_US",
    title: siteConfig.name,
    description: siteConfig.ogDescription,
    url: siteConfig.url,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.ogDescription,
    creator: siteConfig.creator,
  },
  robots: {
    index: false,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/webmanifest.json",
};
