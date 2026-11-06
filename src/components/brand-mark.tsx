import { CarFront } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';

/** The product mark: an indigo tile with a car, plus the name (hidden in the icon-only sidebar). */
export function BrandMark({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  const large = size === 'lg';
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-card',
          large ? 'size-11' : 'size-8',
        )}
      >
        <CarFront className={large ? 'size-6' : 'size-4.5'} aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
        <span className={cn('truncate font-semibold', large ? 'text-lg' : 'text-sm')}>
          {t('brand.name')}
        </span>
        <span className="truncate text-xs text-muted-foreground">{t('brand.tagline')}</span>
      </div>
    </div>
  );
}
