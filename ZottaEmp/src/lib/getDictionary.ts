
// src/lib/getDictionary.ts
import 'server-only'; // Ensures this module is only used on the server

export type Locale = 'en' | 'it';

const dictionaries = {
    en: () => import('@/locales/en/common.json').then((module) => module.default),
    it: () => import('@/locales/it/common.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale | string) => {
    const validLocale = (locale === 'en' || locale === 'it') ? locale : 'it'; // Fallback to 'it'
    return dictionaries[validLocale]();
};

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
