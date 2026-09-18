# USC Campus Walk — deploying to Vercel

This is a single static page. There is no build step, no framework and no
server code: `index.html` contains the world data and the whole engine, and
pulls three.js from a CDN at runtime.

## Fastest way (no account setup beyond signing in)

1. Go to vercel.com/new
2. Choose the option to deploy a template/other, then drag this whole folder
   (or the zip) onto the upload area.
3. Vercel detects "Other" as the framework preset. Leave every build setting
   blank — no build command, no output directory.
4. Deploy. You get a live URL in about twenty seconds.

## Recommended way, if you want to keep updating it

1. Make a new GitHub repo and put `index.html` and `vercel.json` at its root.
2. On vercel.com/new, import that repo. Framework preset: **Other**.
   Build command: leave empty. Output directory: leave empty (or `.`).
3. Deploy.

From then on, every `git push` to the main branch redeploys the production
URL automatically. Pushing to any other branch gives you a preview URL you can
look at before merging.

## Vercel CLI

    npm i -g vercel
    cd this-folder
    vercel          # first run creates the project, gives a preview URL
    vercel --prod   # promotes it to the production domain

Re-run `vercel --prod` any time the file changes.

## Notes

- `vercel.json` only tells Vercel not to cache the HTML, so a redeploy shows up
  immediately instead of being served from cache for a while.
- The page loads three.js from cdnjs and two fonts from Google Fonts. Both are
  public CDNs; nothing else leaves the page.
- Every deploy is kept. If an update breaks something, open the project's
  Deployments tab, find the last good one and use "Promote to Production" to
  roll back.
- A custom domain can be added under Settings -> Domains at any time without
  redeploying.
