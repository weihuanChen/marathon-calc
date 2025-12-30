# Repository Guidelines

## Project Structure & Module Organization
- Next.js App Router lives in `app/` with locale-aware entry at `app/[locale]/` (`layout.tsx`, `page.tsx`, plus `privacy-policy`, `support`, `user-service`). Global styles sit in `app/globals.css`; routing middleware is in `middleware.ts`.
- Reusable UI sits in `components/` (e.g., `Calculator`, `PaceChart`, `SplitTable`, `LanguageSelector`). Computation and helpers stay in `lib/calculations.ts` and `lib/utils.ts`.
- Localization config is under `i18n/` with `i18n.config.ts`; locale message bundles live in `messages/`.
- Static assets belong in `public/`. Reference docs and optimization notes are under `docs/` and top-level *.md guides.

## Build, Test, and Development Commands
- `npm install` to sync dependencies.
- `npm run dev` starts the local server (Turbopack) at `http://localhost:3000`.
- `npm run build` creates a production build; `npm run start` runs it.
- `npm run lint` executes the Next + TypeScript ESLint rules; fix violations before sending a PR.

## Coding Style & Naming Conventions
- TypeScript + React function components; client components begin with `'use client';`.
- Prefer 2-space indentation, single quotes, and explicit return types when not inferred. Keep JSX props sorted logically (layout/behavior first, classNames last).
- Components and files use `PascalCase`; hooks or utilities use `camelCase`. Keep calculation logic in `lib/` and UI-only concerns in `components/`.
- Styling relies on Tailwind CSS 4 utility classes in JSX and shared tokens in `app/globals.css`; combine classes with `clsx`/`tailwind-merge` instead of manual string concat.
- For i18n, read strings via `useTranslations()` and place new keys in the appropriate locale file under `messages/`.

## Testing Guidelines
- No automated test suite yet; run `npm run lint` and follow the manual flow in `TESTING_GUIDE.md` after UI or calculation changes (exercise all three calculator modes, ensure no “Maximum update depth exceeded” console errors).
- When adjusting calculation logic, cross-check both km and mi presets and verify the split strategies in `Calculator` still render correctly.

## Commit & Pull Request Guidelines
- Use concise, conventional commits (`feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`) similar to existing history. Squash minor fixups before review when possible.
- PRs should describe the change, affected pages/components, and manual test steps. Include screenshots or before/after notes for UI or i18n-visible changes, and mention any docs or message bundle updates.

## Security & Configuration Tips
- Do not commit secrets; keep environment-specific values in local env files. If adding new locales, update `i18n.config.ts` and `messages/` together to avoid routing mismatches.
