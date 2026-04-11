/**
 * Step card: numbered badge, terminal visual left, accent bar, content right.
 * Huttspawn-inspired layout for ranked/numbered content.
 */

export const stepCardBaseClasses = 'grid grid-cols-step border border-border rounded-lg overflow-hidden bg-card relative';

export const stepBadgeBaseClasses =
  'absolute -top-5 -left-5 w-14 h-14 rounded-full flex items-center justify-center font-heading text-2xl font-extrabold z-10 bg-background';

export const stepBadgeVariants: Record<string, string> = {
  cyan: 'border-3 border-primary text-primary',
  green: 'border-3 border-accent text-accent',
  amber: 'border-3 border-warning text-warning',
};

export const stepVisualClasses = 'bg-foreground/10';

export const stepBarClasses = 'w-1';

export const stepBarVariants: Record<string, string> = {
  cyan: 'bg-primary',
  green: 'bg-accent',
  amber: 'bg-warning',
};

export const stepContentClasses = '';

export const stepTitleClasses = 'font-heading text-3xl font-bold text-foreground tracking-tight';

export const stepSubtitleClasses = 'font-heading text-base font-medium text-muted-foreground';

export const stepQuoteClasses = 'text-muted-foreground border-l-2 border-border';

export const stepColumnsClasses = 'grid grid-cols-2 border-t border-border';

export const stepColumnLabelClasses =
  'font-mono text-xs uppercase tracking-widest font-semibold block';
