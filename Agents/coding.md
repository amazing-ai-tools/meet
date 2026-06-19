# Coding Skill - meet

## Scope
Use this skill when implementing code in the `meet` repository.

## Current Stack
- React 18, TypeScript, Vite 5.
- CSS in `src/styles.css`.
- Icons from `lucide-react`.
- No backend, database, router, state library, or test framework is configured yet.

## Key Files
- `src/main.tsx` - app entry point, current React UI, BugZero widget bootstrap.
- `src/styles.css` - global styling.
- `package.json` - scripts: `dev`, `build`, `preview`.
- `.github/workflows/deploy.yml` - deployment pipeline.

## Rules
- Match the existing TypeScript and React style.
- Keep client-exposed env vars under `VITE_`.
- Do not put secrets in frontend code.
- Keep BugZero widget support unless the user explicitly removes it.
- Run `npm run build` before claiming code changes are ready.
