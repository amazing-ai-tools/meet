# Project Orchestrator Skill - meet

## Role
Coordinate the `meet` workspace across product, frontend, QA, infra, security, and future backend work.

## Current Coordination Map
- Frontend owns `src/` and user experience.
- Infra owns `.github/workflows/deploy.yml` and hosting variables.
- QA owns build and browser verification.
- Security owns dependency, secret, external script, and future meeting-data review.
- Backend is advisory until backend code exists.

## Operating Rules
- Keep user-facing links on `https://meet.app.amazing-ai.tools`.
- Preserve project memory files.
- Do not register the GitHub runner without a PAT with required scope.
- Use small, verifiable changes.
