'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { panelSpring } from '@/lib/motion';
import { Icon } from './Icon';

const DESKTOP = '(min-width: 1024px)';

function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(DESKTOP);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => true,
  );
}

/**
 * Modal panel: a right-hand drawer on desktop, a draggable bottom sheet
 * (85% tall) on phones. Esc, the backdrop, or a downward flick closes it.
 */
export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const desktop = useIsDesktop();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, onClose]);

  const hidden = desktop ? { x: '100%' } : { y: '100%' };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            initial={reduceMotion ? { opacity: 0 } : hidden}
            animate={reduceMotion ? { opacity: 1 } : { x: 0, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : hidden}
            transition={panelSpring}
            drag={desktop ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            className={
              desktop
                ? 'absolute top-0 right-0 flex h-full w-[min(480px,92vw)] flex-col border-l border-green/20 bg-surface-high p-6 shadow-soft-lg outline-none'
                : 'absolute inset-x-0 bottom-0 flex h-[85dvh] flex-col rounded-t-card border-t border-green/20 bg-surface-high px-4 pt-2 pb-4 shadow-soft-lg outline-none'
            }
          >
            {desktop ? (
              <button
                type="button"
                onClick={onClose}
                aria-label={t('close')}
                className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-text/70 transition-colors hover:bg-surface hover:text-text"
              >
                <Icon name="close" size={22} />
              </button>
            ) : (
              <div aria-hidden className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-line" />
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
