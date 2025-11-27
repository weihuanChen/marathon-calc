import { AlertTriangle } from 'lucide-react';

type AgreementDisclaimerProps = {
  title: string;
  description: string;
  note?: string;
};

export function AgreementDisclaimer({ title, description, note }: AgreementDisclaimerProps) {
  return (
    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-sm backdrop-blur dark:border-amber-300/30 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="shrink-0">
        <AlertTriangle className="text-amber-500" size={22} aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm leading-relaxed text-amber-900/90 dark:text-amber-50/90">{description}</p>
        {note ? (
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-200">{note}</p>
        ) : null}
      </div>
    </div>
  );
}
