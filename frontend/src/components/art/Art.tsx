'use client';

import { useEffect, useState } from 'react';
import { clubLogoUrl, leagueBadgeUrl, trophyUrl } from '@/lib/art';
import { flagUrl } from '@/lib/catalog';
import { cx } from '@/lib/cx';
import type { Factor } from '@/lib/types';
import { Icon } from '../ui/Icon';
import { Spinner } from '../ui/states';

/** Initials tile — the fallback whenever art is missing or still unknown. Never breaks layout. */
export function Monogram({ text, size, className }: { text: string; size: number; className?: string }) {
  const initials =
    text
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => [...w][0])
      .join('')
      .toLocaleUpperCase() || '?';
  return (
    <span
      aria-hidden
      className={cx('inline-flex shrink-0 items-center justify-center border border-line bg-surface-low font-heading text-green', className)}
      style={{ width: size, height: size, borderRadius: size * 0.22, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}

type Resolver = (name: string) => Promise<string | null>;

/** Resolves an art URL; `enabled: false` (e.g. mid-spin) shows the monogram and makes no request. */
function ResolvedImage({ name, resolve, size, enabled = true }: { name: string; resolve: Resolver; size: number; enabled?: boolean }) {
  const [state, setState] = useState<{ key: string; url: string | null } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void resolve(name).then((url) => {
      if (active) setState({ key: name, url });
    });
    return () => {
      active = false;
    };
  }, [name, resolve, enabled]);

  if (!enabled) return <Monogram text={name} size={size} />;
  const resolved = state?.key === name ? state : null;
  if (!resolved) {
    return (
      <span className="inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <Spinner size={16} stroke={2} className="text-text/60" />
      </span>
    );
  }
  if (!resolved.url || failed === resolved.url) return <Monogram text={name} size={size} />;
  return (
    // Remote art from TheSportsDB: a plain <img> needs no CORS and no image optimizer allow-list.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved.url}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(resolved.url)}
      className="object-contain motion-safe:animate-fade-in"
      style={{ width: size, height: size }}
    />
  );
}

export function ClubLogo({ name, size = 48, enabled = true }: { name: string; size?: number; enabled?: boolean }) {
  return <ResolvedImage name={name} resolve={clubLogoUrl} size={size} enabled={enabled} />;
}

export function LeagueBadge({ name, size = 48 }: { name: string; size?: number }) {
  return <ResolvedImage name={name} resolve={leagueBadgeUrl} size={size} />;
}

export function TrophyImage({ name, size = 48 }: { name: string; size?: number }) {
  return <ResolvedImage name={name} resolve={trophyUrl} size={size} />;
}

export function CountryFlag({ name, size = 48, enabled = true }: { name: string; size?: number; enabled?: boolean }) {
  const [failed, setFailed] = useState(false);
  const url = flagUrl(name);
  if (!enabled || !url || failed) return <Monogram text={name} size={size} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={size}
      height={Math.round(size * 0.72)}
      loading="lazy"
      onError={() => setFailed(true)}
      className="object-cover shadow-soft"
      style={{ width: size, height: size * 0.72, borderRadius: size * 0.14 }}
    />
  );
}

/** The art for an XOX header: flag, club crest, league badge (+ trophy chip when "won"), or trophy. */
export function FactorImage({ factor, size = 42 }: { factor: Factor; size?: number }) {
  switch (factor.type) {
    case 'nationality':
      return <CountryFlag name={factor.value} size={size} />;
    case 'team':
      return <ClubLogo name={factor.value} size={size} />;
    case 'playedLeague':
      return <LeagueBadge name={factor.value} size={size} />;
    case 'wonLeague':
      return (
        <span className="relative inline-flex">
          <LeagueBadge name={factor.value} size={size} />
          <span className="absolute -right-1 -bottom-1 flex rounded-full bg-surface-low p-0.5">
            <Icon name="emoji_events" size={14} className="text-gold" />
          </span>
        </span>
      );
    case 'wonInternational':
      return <TrophyImage name={factor.value} size={size} />;
  }
}
