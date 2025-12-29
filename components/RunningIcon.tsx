import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

export function RunningIcon({ className }: Props) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 64 64"
      className={cn('h-5 w-5', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="40" cy="10" r="6" />
      <path d="M26 50l5-15 8-6 7 8-4 13" />
      <path d="M24 30l10-7 2-9" />
      <path d="M18 52l13-6" />
      <path d="M34 32l-8 8-8-2" />
    </svg>
  );
}
