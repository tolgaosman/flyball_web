import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { isLocale, LOCALE_COOKIE, localeFromAcceptLanguage } from './locale';

export default getRequestConfig(async () => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : localeFromAcceptLanguage((await headers()).get('accept-language'));

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
