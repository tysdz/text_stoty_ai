import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n';

export default createMiddleware({
    // localized text
    locales,

    // localized text
    defaultLocale,

    // URL localized text: localized text
    localePrefix: 'always',

    // localized text，localized text
    localeDetection: false
});

export const config = {
    // localized text，localized text api、_next/static、_next/image、favicon.ico localized text
    matcher: [
        // localized text
        '/',
        '/(vi|en)/:path*',
        // localized text（localized text）
        '/((?!api|m|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.ico).*)'
    ]
};
