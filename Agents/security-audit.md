# Security Audit Skill - meet

## Current Attack Surface
- Static React bundle.
- External BugZero widget script.
- GitHub Actions deployment credentials.
- Frontend environment variables.
- npm dependencies.

## Review Checklist
- No secrets committed to git or exposed via `VITE_` variables.
- `.env` stays local and untracked.
- External scripts are intentional and sourced from trusted URLs.
- Deployment tokens have minimum required scope.
- Dependency updates are reviewed for supply-chain risk.
- Future meeting data features include privacy, retention, authorization, and tenant isolation plans.

## Verification
- Inspect diffs for secret-like values.
- Run `npm audit` when dependency changes are made.
- Run `npm run build` after code changes.
