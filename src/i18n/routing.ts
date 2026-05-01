import { defineRouting } from 'next-intl/routing';

export const locales = ['vi', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'vi';

export const routing = defineRouting({
    // localized text
    locales,

    // localized text
    defaultLocale,

    // URL localized text: localized text
    localePrefix: 'always'
});
