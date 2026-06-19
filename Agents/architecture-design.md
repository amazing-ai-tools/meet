# Architecture Design Skill - meet

## Current Architecture
`meet` is a static Vite/React app deployed as built assets. There is no server runtime in this repo.

## Design Guidance
- Start from product requirements before adding backend services.
- If adding APIs, define the contract, auth model, persistence model, deployment target, and tests.
- Keep static frontend concerns separate from future server concerns.
- Prefer simple browser-first flows until meeting data, identity, payments, or integrations require a backend.

## Known Decisions
- Public URL: `https://meet.app.amazing-ai.tools`.
- Repo: `https://github.com/amazing-ai-tools/meet`.
- Runner label planned for later: `vps-meet`.
