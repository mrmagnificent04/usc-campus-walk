# USC Campus Walk

A first-person walking tour of USC's University Park Campus and Exposition Park,
in the browser. Walk with WASD, look with the arrow keys, press T to jump between
landmarks and F to fly above campus. Built with three.js from OpenStreetMap
footprints, with the landmark buildings (Doheny, Leavey, Bovard, Mudd, the DMC,
the Coliseum, the Rose Garden and more) modelled by hand.

## Layout

- `index.html` is the finished, self-contained page. This is what Vercel serves.
- `world.txt` is the map data. The `*.js` files are the engine and the hand-built places,
  concatenated in order by `build.sh`.
- `CLAUDE.md` explains the code, the build and the testing tools in detail.

## Updating the site

```
./build.sh               # builds game.html from the sources
python3 make_deploy.py   # turns game.html into index.html
git add -A && git commit -m "..." && git push
```

## Deploying to Vercel

It is a single static page: no framework, no build command, no server code.
Import this repo at vercel.com/new, leave the framework preset as "Other" and every
build setting blank, and deploy. Pushes to `main` redeploy automatically.
`vercel.json` only turns off long caching so updates show up right away.
