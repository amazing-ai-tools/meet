# Deploying Skill - meet

## Deployment Stack
- GitHub Actions workflow: `.github/workflows/deploy.yml`.
- Node 22.
- Build: `npm ci --include=dev` then `npm run build`.
- Default deploy target: Azure Static Web Apps.
- Optional deploy target: Cloudflare Pages when `HOSTING_PROVIDER=cloudflare_pages`.

## Required Repo Variables
- `APP_DISPLAY_NAME`
- `APP_DOMAIN`
- `BUGZERO_APP_KEY`
- `BUGZERO_WIDGET_URL`
- `RUNNER_LABEL`

## Required Secrets
- Azure path: `AZURE_STATIC_WEB_APPS_API_TOKEN`.
- Cloudflare path: `CLOUDFLARE_API_TOKEN`.

## Runner
Self-hosted runner registration is skipped until `GH_TOKEN` with `repo` scope is supplied. Intended label: `vps-meet`.

## User-Facing Links
Use `https://meet.app.amazing-ai.tools`, not localhost or VPS-only URLs, unless the user explicitly asks for internal debugging details.
