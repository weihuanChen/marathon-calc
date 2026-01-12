'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface BlogSidebarTocProps {
  headings: Heading[];
}

export function BlogSidebarToc({ headings }: BlogSidebarTocProps) {
  const t = useTranslations('blog');
  const [activeId, setActiveId] = useState<string>('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Remove user-content- prefix if present to match our heading IDs
            const cleanId = entry.target.id.replace('user-content-', '');
            setActiveId(cleanId);
          }
        });
      },
      {
        rootMargin: '-100px 0px -66%',
        threshold: 0,
      }
    );

    headings.forEach(({ id }) => {
      // Try with and without user-content- prefix
      const element = document.getElementById(id) || document.getElementById(`user-content-${id}`);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach(({ id }) => {
        const element = document.getElementById(id) || document.getElementById(`user-content-${id}`);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progressPercent = Math.min((scrolled / documentHeight) * 100, 100);
      setProgress(progressPercent);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    // Try with and without user-content- prefix (for GFM compatibility)
    const element = document.getElementById(id) || document.getElementById(`user-content-${id}`);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveId(id);
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24">
        {/* Progress Bar */}
        <div className="mb-4 overflow-hidden rounded-full bg-gray-200/50 dark:bg-gray-700/50 h-1">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* TOC Card */}
        <nav className="rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              {t('toc.title')}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round(progress)}%
            </span>
          </div>

          <ul className="space-y-1">
            {headings.map((heading) => {
              const isActive = activeId === heading.id;
              const indent = heading.level === 3 ? 'pl-4' : 'pl-0';

              return (
                <li key={heading.id} className={`${indent}`}>
                  <a
                    href={`#${heading.id}`}
                    onClick={(e) => handleClick(e, heading.id)}
                    className={`group relative block rounded-lg py-2 px-3 text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-orange-50/80 dark:bg-orange-950/30 font-medium text-gray-900 dark:text-gray-100'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    style={{
                      fontFamily: heading.level === 2
                        ? 'var(--font-display), sans-serif'
                        : 'var(--font-body), sans-serif',
                    }}
                  >
                    <span className="relative z-10 line-clamp-2">
                      {heading.text}
                    </span>

                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full" />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Bottom hint */}
          <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {t('toc.jump')}
            </p>
          </div>
        </nav>
      </div>
    </aside>
  );
}
