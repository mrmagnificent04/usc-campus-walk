# USC Campus Walk

A single-file, keyboard-only, first-person three.js (r128) walking tour of USC's
University Park Campus and Exposition Park. Jamie built it to show family around campus.
Published as a claude.ai artifact, and this repo deploys to Vercel as a static site
(Vercel serves the root `index.html`; there is no build step on Vercel).

## Build

- `./build.sh` concatenates the sources into `game.html` (git-ignored) (three.js from cdnjs) and
  `test.html` (uses `three.local.js`, no network):
  `a_world.js a2_coliseum.js a2b_assoc.js a2c_rose.js a3_landscape.js b_play.js e_crowd.js c_main.js d_loop.js`
  wrapped in `head.html` + `world.txt` (the map data, in a `<script type="text/plain">`).
- `d_loop.js` is always a copy of `d_loop.rel.js` (release). `d_loop.dev.js` adds debug
  hooks (`window.__cam`, `window.__lock`, `window.__dbg`). Edit BOTH when changing the loop.
- `./builddev.sh` builds `testdev.html` with the dev loop, then rebuilds the release files.
- `python3 make_deploy.py` turns `game.html` into the root `index.html` (adds doctype/head/body).
  Commit `index.html` after every change so the Vercel site updates.
- Release check: `grep -c __dbg game.html` must be 0.

## Visual testing

`node snap.js <prefix> testdev.html` loads the page in headless Chromium (SwiftShader),
clicks Play, and for each `[name,x,y,z,tx,ty,tz]` in `shots.json` puts the camera at x,y,z
looking at tx,ty,tz and saves `snap/<prefix>_<name>.png`. Needs `npm i playwright` and a
Chromium (`npx playwright install chromium`). SwiftShader is slow: allow ~1-2 min per shot
around the rose garden. Chromium occasionally crashes ("Target crashed"); just rerun.

## Coordinates and data

- Metres. +x east, +z south, y up. Tommy Trojan is near the origin. The campus street grid
  is rotated about 27.6 degrees from true north.
- `world.txt` sections: `##L` labels, `##C` USC buildings (`style+height|name|tower|ring`),
  `##B` city buildings, `##R` roads, `##P` paths, `##A` areas, `##W` water, `##N` points,
  `##S` stadia, `##G` parks. Rings are an absolute first point then deltas.
- Buildings in `CUSTOM[name]` (in `a_world.js`) get hand-built geometry; others use style rules.
- Shared helpers in `a_world.js`: `prism`, `band`, `flat`, `archFace`, `hipRoof`,
  `sqWindows`, `archedWindows`, `bayFacade`, `lombardBand`, `wallFacing`, `wallKit`,
  `faceToward`, `facadeText`, `segBox`, `oriBox`, `addCollider`, `Mesher`.
- Tree placement: `TREE_POS` entries `[x,z,kind,species,scale]`; exclusions via `NO_PLANT`,
  `NO_LAWN_TREES`. Trees are built in `a3_landscape.js`.
- Code runs inside a strict-mode IIFE: functions declared inside blocks are block-scoped,
  so use `var f=function(){}` inside loops/ifs.

## Notable hand-built places

- Coliseum (`a2_coliseum.js`): sunken bowl, peristyle, torch, Court of Honor.
- Associates Park (`a2b_assoc.js`).
- Exposition Park Rose Garden (`a2c_rose.js`): bed grid, central walk, fountain plaza.
  `ROSE` is set in `a_world.js`, which also strips the garden's OSM fountain and paths.
- Leavey Library, Doheny Memorial Library, Taper Hall, Zumberge Hall, Fertitta Hall,
  Dr. Joseph Medicine Crow Center (DMC; formerly Von KleinSmid) in `a_world.js` CUSTOM.

## Jamie's standing requests (do not undo)

- Walkways: simple gray concrete with a brick edge. No street trees on walkways, no bikes,
  no tilework, no black perimeter fence, no brick plaza overlay.
- Traveler statue stays at (20,61).
- Use current building names (DMC, not VKC).
- Writing style for anything he reads: no em dashes, concise and plain, honest evaluation
  rather than praise.

## Publishing

The live artifact is https://claude.ai/artifact/Jd3u1kv8vcGABwVjfZZHCz (version 17 as of
this handoff). Publishing there needs the Artifact tool from a Claude session. From
Claude Code, rebuild `index.html` and push to GitHub; Vercel redeploys from `main`.
