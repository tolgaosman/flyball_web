'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Icon } from './Icon';

/** The AppBar: back to games, centered title, optional trailing action. Translucent over the pitch. */
export function PageHeader({ title, backHref = '/', action }: { title: string; backHref?: string; action?: ReactNode }) {
  const t = useTranslations();
  return (
    <header className="sticky top-0 z-20 bg-bg/70 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[48px_1fr_48px] items-center px-4 lg:px-8">
        <Link
          href={backHref}
          aria-label={t('back')}
          className="flex size-11 items-center justify-center rounded-full text-text transition-colors hover:bg-surface-high"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="truncate text-center font-heading text-xl">{title}</h1>
        <div className="flex justify-end">{action}</div>
      </div>
    </header>
  );
}
