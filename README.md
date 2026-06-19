# MeetTeams

MeetTeams is a real-time meeting app for `meet.app.amazing-ai.tools`: instant link meetings without mandatory login, optional Google identity, and authenticated team workspaces with persistent rooms.

## What is included

- React 18 + TypeScript + Vite frontend.
- LiveKit React meeting UI for video, audio, screen share, chat, participants, mute/camera, and leave controls.
- Node 22 + TypeScript backend for:
  - guest sessions
  - optional Google login
  - instant rooms
  - team workspaces
  - persistent team rooms
  - LiveKit join token generation
- JSON file persistence for the MVP backend state on the VPS.
- Cloudflare Pages frontend deploy workflow.
- VPS backend deploy workflow for the `vps-meet` self-hosted runner.
- LiveKit self-hosting example with Redis.

## Local development

```bash
npm ci --include=dev
cp .env.example .env
npm run dev:server
npm run dev
```

The frontend expects `VITE_API_BASE_URL` to point at the backend. In production use:

```text
VITE_API_BASE_URL=https://meet.app.amazing-ai.tools/api
```

## Required environment

Backend:

- `PORT`
- `PUBLIC_ORIGIN`
- `MEETTEAMS_DATA_PATH`
- `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

Frontend build:

- `VITE_APP_NAME`
- `VITE_APP_DOMAIN`
- `VITE_API_BASE_URL`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_BUGZERO_APP_KEY`
- `VITE_BUGZERO_WIDGET_URL`

GitHub Actions:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PROJECT_NAME`
- `BACKEND_ORIGIN` Cloudflare Pages environment variable, pointing to the public VPS backend origin
- `RUNNER_LABEL=vps-meet`
- `BACKEND_PORT=8787`
- `CLOUDFLARE_API_TOKEN` secret
- `SESSION_SECRET` secret
- `LIVEKIT_API_KEY` secret
- `LIVEKIT_API_SECRET` secret

The backend deploy writes `/opt/meetteams/.env` on the VPS from GitHub vars and secrets.

## LiveKit self-hosting

Use `deploy/livekit/docker-compose.yml` and copy `deploy/livekit/livekit.example.yaml` to `deploy/livekit/livekit.yaml` on the VPS. Replace the LiveKit API key and secret in both the LiveKit config and `/opt/meetteams/.env`.

Open the required LiveKit ports on the VPS:

- `7880/tcp`
- `7881/tcp`
- `50000-50100/udp`
- `5349/tcp` if TURN/TLS is used

## Verification

```bash
npm test
npm run build:server
npm run build
```

## Current MVP boundaries

- Google login is optional for instant meetings and required for team/workspace creation.
- Guest users can create and join ad-hoc meetings by name.
- The backend persists MVP state in a JSON file; move to Postgres or SQLite before high-concurrency production use.
- Host moderation UI is present in the meeting shell. Full remote mute/remove enforcement should be wired to LiveKit room service endpoints before broad production rollout.
