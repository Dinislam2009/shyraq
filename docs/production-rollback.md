# Production rollback

## Current production

The Shyraq Vercel production project is `shyraq-93xj`.

Use the Vercel production alias:

```text
https://shyraq-93xj.vercel.app
```

## Roll back to the previous verified deployment

1. Open the Vercel project and identify the last deployment marked `Ready` that is known to work.
2. Use Vercel's **Promote to Production** action for that deployment.
3. Verify `/api/health` returns HTTP 200 and reports `database:"ok"`.
4. Verify `/login`, `/signup`, and `/offline` return HTTP 200.
5. Run the local smoke suite before the next forward deployment:

```powershell
npm run test
npm run build
npm run test:e2e
npm run test:api
```

## CLI rollback

When the Vercel CLI is linked to the project, inspect recent deployments with:

```powershell
npx vercel ls
```

Then redeploy the known-good deployment shown by Vercel:

```powershell
npx vercel redeploy <deployment-url>
```

For a production promotion, use the Vercel dashboard's deployment promotion controls and verify the live health endpoint afterwards.

## Safety rules

Never delete the last known-good production deployment before a replacement has been verified. Keep the database schema backward compatible with the application version being promoted.
