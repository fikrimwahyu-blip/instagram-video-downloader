export const locales = {
  ID: "id-ID",
  EN: "en-US",
  ES: "es-ES",
  RU: "ru-RU",
  DE: "de-DE",
  FR: "fr-FR",
} as const;

export const DEFAULT_LOCALE = locales.ID;

export const localesList = [
  locales.ID,
  locales.EN,
  locales.ES,
  locales.RU,
  locales.DE,
  locales.FR,
] as const;

export const localeOptionsList = [
  { value: locales.ID, label: "Bahasa Indonesia" },
  { value: locales.EN, label: "English" },
  { value: locales.ES, label: "Español" },
  { value: locales.RU, label: "Русский" },
  { value: locales.DE, label: "Deutsch" },
  { value: locales.FR, label: "Français" },
] as const;
