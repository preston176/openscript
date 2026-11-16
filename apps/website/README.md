# OpenScript website

The marketing site at https://tryopenscript.vercel.app. It serves `/` and proxies `/app/*` to the editor (`apps/web`); see `next.config.ts`.

```bash
npm install                            # from the repo root
npm run dev -w @openscript/website     # http://localhost:3000
```

- `app/page.tsx`: the landing page
- `components/demo-reel.tsx`: the scripted editor demo in the hero
- `lib/site.ts`: product name, links and copy shared by the page and footer

MIT licensed.
