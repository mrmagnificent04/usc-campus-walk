# USC Campus Walk

A first-person walking tour of USC's University Park Campus and Exposition Park,
in the browser. On a computer: walk with WASD, look with the arrow keys or mouse, press T to
jump between landmarks and F to fly. On a phone or tablet: left thumb walks, right thumb
looks, with buttons for NEXT STOP, RUN and FLY. Built with three.js from OpenStreetMap
footprints, with the landmarks modelled by hand: Doheny, Leavey, Bovard, Mudd, the DMC, the
Coliseum, the Rose Garden, the Natural History Museum, the California Science Center, and the
Expo Park/USC Metro station. A generated South LA surrounds the map, with the downtown
skyline on the horizon. It lowers its own detail if the frame rate drops.

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
