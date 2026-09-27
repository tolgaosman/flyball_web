import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { Inter, Space_Grotesk } from 'next/font/google';
import { PitchBackdrop } from '@/components/ui/PitchBackdrop';
import { Providers } from './providers';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin', 'latin-ext'], weight: ['600', '700'], variable: '--font-space-grotesk' });
const inter = Inter({ subsets: ['latin', 'latin-ext'], weight: ['400', '500'], variable: '--font-inter' });

/** Every Material Symbol the site uses (alphabetical — required by the Google Fonts subset API). */
const ICON_NAMES = [
  'abc', 'add', 'alternate_email', 'arrow_back', 'badge', 'bolt', 'calendar_today', 'close', 'cloud_off', 'edit',
  'emoji_events', 'error', 'grid_3x3', 'group', 'hourglass_bottom', 'ios_share', 'lightbulb', 'lock', 'logout',
  'password', 'person', 'play_arrow', 'public', 'refresh', 'remove', 'search', 'search_off', 'sports_soccer',
  'visibility', 'visibility_off', 'wifi_off',
];

export const metadata: Metadata = {
  title: 'Flyball — football trivia, played together',
  description: 'Football XOX, 2 Team 1 Player and 1 Team 1 Country — every answer checked live by AI.',
  icons: { icon: '/flyball_app_logo.png', apple: '/flyball_app_logo.png' },
};

export const viewport: Viewport = {
  themeColor: '#14130f',
  colorScheme: 'dark',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,0..1,0&icon_names=${ICON_NAMES.join(',')}&display=block`}
        />
      </head>
      <body>
        <NextIntlClientProvider>
          <Providers>
            <PitchBackdrop />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
