export interface SubjectColor {
  id: string;
  name: string;
  hex: string;
  badgeBg: string;
  badgeText: string;
}

export const SUBJECT_PALETTE: SubjectColor[] = [
  { id: 'forest', name: 'Forest Green', hex: '#2c5649', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40', badgeText: 'text-emerald-800 dark:text-emerald-300' },
  { id: 'navy', name: 'Deep Navy', hex: '#1e3a5f', badgeBg: 'bg-sky-50 dark:bg-sky-950/40', badgeText: 'text-sky-800 dark:text-sky-300' },
  { id: 'terracotta', name: 'Terracotta', hex: '#a84c32', badgeBg: 'bg-orange-50 dark:bg-orange-950/40', badgeText: 'text-orange-800 dark:text-orange-300' },
  { id: 'ochre', name: 'Warm Amber', hex: '#b47422', badgeBg: 'bg-amber-50 dark:bg-amber-950/40', badgeText: 'text-amber-800 dark:text-amber-300' },
  { id: 'purple', name: 'Muted Plum', hex: '#634b7d', badgeBg: 'bg-purple-50 dark:bg-purple-950/40', badgeText: 'text-purple-800 dark:text-purple-300' },
  { id: 'teal', name: 'Slate Teal', hex: '#2c6b6b', badgeBg: 'bg-teal-50 dark:bg-teal-950/40', badgeText: 'text-teal-800 dark:text-teal-300' },
  { id: 'rose', name: 'Dusty Rose', hex: '#8c485c', badgeBg: 'bg-rose-50 dark:bg-rose-950/40', badgeText: 'text-rose-800 dark:text-rose-300' },
  { id: 'charcoal', name: 'Graphite', hex: '#444b54', badgeBg: 'bg-stone-100 dark:bg-stone-800/60', badgeText: 'text-stone-800 dark:text-stone-300' },
];

export function getSubjectColor(hex?: string): SubjectColor {
  if (!hex) return SUBJECT_PALETTE[0];
  const found = SUBJECT_PALETTE.find(c => c.hex.toLowerCase() === hex.toLowerCase());
  return found || {
    id: 'custom',
    name: 'Custom',
    hex,
    badgeBg: 'bg-stone-100 dark:bg-stone-800',
    badgeText: 'text-stone-800 dark:text-stone-200',
  };
}
