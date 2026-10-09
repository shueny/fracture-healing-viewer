# Deploying to Vercel

The site is a static build (`dist/`). Vercel builds it from GitHub on every push.

## One-time setup (owner, about 3 minutes)

1. Sign in at https://vercel.com with GitHub.
2. **Add New → Project → Import** `shueny/fracture-healing-viewer`.
3. Vercel reads `vercel.json`: framework Vite, install `pnpm install --frozen-lockfile`, build `pnpm build`, output `dist`. Keep the defaults.
4. **Settings → General → Node.js Version: 22.x** (the build runs TypeScript scripts directly, which needs Node 22.18+).
5. Deploy. The production URL is `https://<project>.vercel.app`; every PR also gets a preview URL.

## Afterwards

- Put the production URL in the README (Demo link) and the GitHub repo "Website" field.
- Check the PRD acceptance list on the live site in desktop Chrome: ~60 fps while playing, first load < 3 s, scenario switch < 100 ms.

## What gets deployed

| file                                             | size (gzip) |
| ------------------------------------------------ | ----------- |
| JS bundle (React, three.js, R3F, drei, Recharts) | ~455 KB     |
| CSS                                              | ~3 KB       |
| `models/femur.glb` (placeholder)                 | ~38 KB      |
