# Frontend Testing Skill - meet

## Current Verification
- `npm run build` runs TypeScript compilation and Vite production build.
- No dedicated frontend test runner is configured yet.

## Recommended Additions
- Vitest for component and utility tests once logic appears.
- React Testing Library for interactive components.
- Playwright for critical browser flows once the app has real workflows.

## Smoke Checklist
- Build succeeds.
- Main screen renders with app name and public domain environment variables.
- BugZero widget injection does not duplicate scripts.
- Layout works on mobile and desktop.
- External links use the public app URL or approved app-owned routes.
