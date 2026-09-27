import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge the custom type-scale utilities (globals.css) so e.g.
// `text-headline` is treated as a font size and never dropped next to `text-green`.
const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display-xl', 'display', 'title', 'headline', 'body', 'caption', 'overline'] }],
      shadow: [{ shadow: ['soft', 'soft-lg', 'glow', 'glow-lg'] }],
      rounded: [{ rounded: ['card', 'chip'] }],
    },
  },
});

/** Joins class names; later classes win over conflicting earlier ones (e.g. padding overrides). */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return merge(classes.filter(Boolean).join(' '));
}
