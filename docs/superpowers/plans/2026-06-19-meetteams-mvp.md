# MeetTeams MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first functional MeetTeams version: instant link meetings without login, optional Google identity, team workspaces with persistent rooms, LiveKit-backed meeting UI, backend token API, and deploy scaffolding.

**Architecture:** Keep the existing React/Vite frontend and add a small Node/TypeScript backend for identity, teams, rooms, and LiveKit token creation. Store MVP state in a local JSON data store on the VPS so the first deploy does not require managed database provisioning; keep repository boundaries ready for a later SQLite/Postgres migration.

**Tech Stack:** React 18, TypeScript, Vite, LiveKit React Components, Node 22, Express, LiveKit server SDK, Google Identity Services, GitHub Actions, Docker Compose, systemd.

---

### Task 1: Backend Domain and Tests

**Files:**
- Create: `server/src/domain.ts`
- Create: `server/test/domain.test.mjs`
- Modify: `package.json`

- [ ] Write failing tests for instant room creation, guest participants, team auth requirements, and host permissions.
- [ ] Run `npm test` and verify the tests fail before implementation.
- [ ] Implement the domain helpers and in-memory data store shape.
- [ ] Run `npm test` and verify the tests pass.

### Task 2: Backend API

**Files:**
- Create: `server/src/index.ts`
- Create: `server/src/store.ts`
- Create: `server/src/auth.ts`
- Create: `server/src/livekit.ts`
- Create: `server/tsconfig.json`
- Create: `.env.example`

- [ ] Expose health, auth, instant room, team, room, and LiveKit token endpoints.
- [ ] Ensure LiveKit API secret remains server-only.
- [ ] Support Google ID token login when configured, and signed guest sessions for ad-hoc meetings.
- [ ] Run `npm run build:server`.

### Task 3: Frontend MeetTeams App

**Files:**
- Replace: `src/main.tsx`
- Replace: `src/styles.css`
- Create: `src/api.ts`
- Create: `src/types.ts`

- [ ] Build app shell, dashboard, instant meeting creation, route handling, lobby, meeting room, chat, participant list, and host controls.
- [ ] Integrate `@livekit/components-react` and `livekit-client` for media, screen share, chat, participant list, mute/camera/leave.
- [ ] Keep guest creation and join flow available without login.
- [ ] Add optional Google button when `VITE_GOOGLE_CLIENT_ID` is present.
- [ ] Run `npm run build`.

### Task 4: Deploy and LiveKit Ops

**Files:**
- Create: `deploy/livekit/docker-compose.yml`
- Create: `deploy/livekit/livekit.example.yaml`
- Create: `deploy/systemd/meetteams-backend.service`
- Modify: `.github/workflows/deploy.yml`
- Create: `.github/workflows/deploy-backend.yml`

- [ ] Keep frontend deploy compatible with Cloudflare Pages.
- [ ] Add backend deploy workflow for the self-hosted `vps-meet` runner.
- [ ] Add LiveKit self-hosting example with Redis.
- [ ] Document required secrets and environment variables.

### Task 5: Verification

**Files:**
- Modify: `README.md`

- [ ] Run `npm test`.
- [ ] Run `npm run build:server`.
- [ ] Run `npm run build`.
- [ ] Scan for unreplaced placeholders in product files.
- [ ] Report exact verification evidence and any external deployment steps still requiring secrets/PAT.
