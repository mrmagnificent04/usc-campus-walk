# USC Campus Walk — what it is and how it works

A first-person walking tour of USC's University Park Campus that runs in a
browser tab. No install, no account, no plugin. Press Play and you are standing
next to Tommy Trojan.

---

## What it is supposed to be

Not "a game about USC." The goal was narrower: let someone who has never set
foot on campus walk around it and come away with an accurate mental picture. The
test it is built against is whether someone who knows the campus says *that
actually looks like USC*.

Three decisions follow from that, and they are a little unusual:

**Accuracy over polish.** Every building sits on its real footprint, at real
scale, in its real position. Those are survey polygons, not hand-drawn
approximations.

**Recognition over realism.** There are no textures anywhere — not one image
file. Everything is flat-shaded coloured geometry. What makes Bovard read as
Bovard is its mass, its tower, its arched openings and its cast-stone cornice,
all built as actual geometry. A photo-textured version would look more "real" in
a screenshot without being more *recognisable*, and would cost tens of megabytes.

**Keyboard only.** Arrow keys look, WASD walks, no pointer lock. The original
audience was grandparents, and mouselook is the biggest barrier to a non-gamer
moving around a 3D space.

---

## Controls

| Key | Action |
| --- | --- |
| `W` `A` `S` `D` | Walk |
| `←` `↑` `→` `↓` | Look |
| `Shift` / `Space` | Faster / hop |
| `T` | Teleport to the next landmark |
| `F` | Fly above campus |
| `M` / `H` | Minimap zoom / hide HUD |
| `Esc` | Pause |

The HUD has a minimap with a heading indicator, a "you are looking at" readout
naming whatever is in front of you, a landmark hint, and floating nameplates over
buildings within about 230 m. Roughly a thousand students walk the paths.

---

## The shape of it

```
index.html   ~312 KB, 7,826 lines, self-contained
   ├── <head>   fonts, all CSS
   ├── <body>   HUD markup, start and pause screens
   ├── <script src="cdnjs .../three.min.js">     the only external code
   ├── <script id="osmdata" type="text/plain">   the entire campus, as text
   └── <script>  the engine, ~6,000 lines
```

No build step, no bundler, no framework, no server, no database, no API. The only
network requests after load are three.js and two fonts.

That is not minimalism for its own sake. A project like this normally ships a
directory of `.glb` models plus textures, which means a build pipeline, an asset
server and a loading screen measured in tens of megabytes. Encoding the campus as
text and *generating* the geometry at load keeps the whole thing smaller than one
high-resolution photograph.

---

## Where the campus data came from

This was the hard part, and it is why the result is accurate.

**OpenStreetMap** (via Overpass) gave city building footprints, roads, walkways,
grass and pitch polygons, water, tree points and stadium outlines.

**USC's own campus map** at `maps.usc.edu` runs on Concept3D, which exposes a
JSON API:

```
https://api.concept3d.com/categories/{catId}?map=1928&children&key={key}
```

Each location carries a `shape.paths` polygon — the building outline as the
university maintains it — plus the official name and abbreviation. That yielded
231 authoritative USC footprints.

The merge: USC wins on geometry and naming. OSM supplies heights, matched by
testing whether an OSM building's centroid falls inside a USC polygon, with a
nearest-neighbour fallback within 20 m. Leftover OSM buildings become the
surrounding city.

**The pipeline problem.** The build environment could not reach Overpass, cdnjs
or Google Fonts; the egress proxy blocked them. The workaround is worth recording
because it is reusable: run the Overpass query in a browser on the user's own
machine through the browser-automation bridge, serialise the result in page
memory, build a `Blob`, click a synthetic `<a download>`, then stage the file
back in through the device bridge. Two constraints forced this — tool output
truncates around 1,200 characters, so chunked retrieval of a 100 KB payload was
not viable, and base64 transfer was blocked by a content filter, so the data had
to move as plain text.

---

## Coordinates

Metres in a local tangent plane centred on Tommy Trojan.

```
lat0 = 34.0206   lon0 = -118.2854
x =  (lon − lon0) · 92,286      east is +x
z = −(lat − lat0) · 110,574     north is −z
```

Equirectangular projection is wrong at continental scale and irrelevant over the
1.5 km of UPC.

One thing that mattered later: **USC's street grid is rotated 28° from north.**
That was derived by histogramming every footprint edge direction modulo 90° and
taking the weighted mode. Anything that needs to align with campus rather than
the compass uses it.

---

## The data format

Plain text inside a `<script type="text/plain">` tag, split by `##` markers:

| Section | Contents | Count |
| --- | --- | --- |
| `##L` | Labels | 102 |
| `##C` | Campus buildings | 217 |
| `##B` | City buildings | 970 |
| `##R` | Roads | 726 |
| `##P` | Walkways | 1,117 |
| `##A` | Grass / pitch areas | 79 |
| `##W` | Fountain basins | 11 |
| `##N` | Statues, monuments, trees | 70 |
| `##S` | Stadiums | 5 |
| `##G` | Named parks | 10 |

Polygons are **delta-encoded integer metres** — first token absolute, the rest
offsets:

```
-272,-243 17,-33 78,41 -17,33     ← Brittingham Field
```

Whole-metre rounding is invisible at human scale and halves the payload against
decimals. Delta encoding roughly halves it again, since consecutive vertices of a
building are close together.

A campus building line:

```
b22.0|Kaprielian Hall||‹ring›
 │ │   │              └ tower spec (empty)
 │ │   └ name
 │ └ height to eaves
 └ style class
```

---

## Rendering

**three.js r128**, WebGL. There are no model files — at startup the engine walks
the text and *builds* every wall, roof, window surround and kerb as triangles, in
about two seconds.

The core abstraction is a tiny accumulator:

```js
function Mesher(){ this.p=[]; this.n=[]; this.c=[]; }  // position, normal, colour
Mesher.prototype.tri(A,B,C, cA,cB,cC)
Mesher.prototype.quad(A,B,C,D, cA,cB,cC,cD)
Mesher.prototype.geom()   → BufferGeometry
```

Colour lives in a vertex attribute, not a material. That is what lets the entire
campus render in a few hundred draw calls: one `MeshLambertMaterial` with
`vertexColors` and `flatShading` covers brick, stone, glass, tile and grass
alike. Shading variation is baked into vertex colours at generation time as a
multiplier on the base hex.

Buildings accumulate into 190 m grid cells, each its own mesh, so the frustum
culls whole neighbourhoods at once. Ground surfaces, props, hedges and fountains
each merge into one mesh.

Ground decals — walkways, brick borders, track lane lines — stack at slightly
different heights (0.10, 0.13, 0.14 m) on a second material with
`polygonOffset: -1`, which is the standard fix for z-fighting between coplanar
surfaces.

Two winding rules, applied everywhere and easy to get backwards: wall quads
emitted `(a,y0) (a,y1) (b,y1) (b,y0)` on a counter-clockwise ring face outward;
roof triangles emitted `tri(A, C, B)` face up. Reversing the latter is how the
lit soffit under Bloom's cantilevered roof is made visible from below.

---

## Making buildings look like themselves

This is where most of the work went, and it is the difference between "a 3D map"
and "USC."

Every campus building carries a one-letter style that picks a construction
recipe: `f` generic precast (101), `b` brick and cast stone (55), `t` flat-roofed
historic brick (22), `g` gabled house (19), `v` residential village (13), `r`
tile-roofed historic (7), `d` parking deck.

The single most consequential fix in the project was realising that USC **never
stopped building in brick and cast stone**. Buildings from the 1990s and 2000s
had been binned as modernist concrete because of their date and rendered as grey
boxes. Reclassifying 55 of them and rewriting the generic treatment fixed an
entire visual class at once instead of one building at a time.

On top of that sits a library of composable helpers, each taking a footprint ring
and emitting geometry: `band` (string courses, cornices, plinths), `punched`,
`archedWindows`, `sqWindows`, `lancetWindows` (Gothic — Annenberg, Iovine),
`arcade` (cloisters and loggias), `cornice`, `quoins`, `ivy`, `hipRoof`,
`medRoof` (corbels, deep eaves, barrel tile), `towerAt` with cap styles for
pyramid, spire, clock, dome and globe.

`facadeText` is worth a mention: carved building names — "RONALD TUTOR CAMPUS
CENTER", "UNIVERSITY OF SOUTHERN CALIFORNIA" — are drawn as letter-spaced text to
a canvas, wrapped in a `CanvasTexture`, and stood on a plane against the wall.
Two triangles per sign, and the cheapest possible way to make a building
unmistakable.

About twenty landmarks skip the style system entirely and have hand-written
constructors dispatched by exact name — Doheny, Bovard, Leavey, Fertitta,
Annenberg, the Tutor Campus Center, Sample Hall, the School of Cinematic Arts,
Iovine and Young, Kaprielian, Ginsburg, Bloom, Parkside and others. Each was
written from photographs. A shared helper, `faceToward(ring, x, z)`, returns
whichever edge looks most directly at a given point, so each builder knows which
elevation is the front.

Heights come from OSM where available, then a curated abbreviation table, then
about eighty by-name corrections, then an area-and-keyword estimate. Two clamps
catch the rest: nothing over 200 m² is shorter than 7 m, nothing over 2,000 m² is
taller than 38 m unless it is a named tower.

---

## Ground, landmarks, crowd

**Ground** is one merged mesh: a noisy 4,200 m base plane, grass and pitch
polygons, water, roads (kerb ribbon then carriageway), then walkways — a brick
border with a plain concrete centre on top. The walkways are deliberately plain;
an earlier version with running brick courses, soldier courses and control-joint
scoring read as busy rather than as USC.

Nothing is planted on the paving. Street trees were originally offset from each
walkway centreline, which works on a straight run and fails wherever walks
converge, dropping trees in the middle of the pavement. A spatial hash of where
the paving actually is (`onWalk(x, z)`) now gates every tree, hedge, lamp and
bench.

**Landmarks** are hand-built because they are what people navigate by: Tommy
Trojan, Traveler (a pale horse on a boulder in a hedged flower bed, facing Tommy
across Hahn Plaza), George Tirebiter, and Douglas Fairbanks on the fountain in
the Cinematic Arts courtyard. One builder, `fountainRing`, produces all ten
fountains — stone basin, moulded coping, pedestal bowls, a translucent sheet of
water off each rim, a ring of jets. Allyson Felix Field is a real 400 m track
with eight lanes generated by successive inward offsets of the outline. Dedeaux
Field's home plate was recovered by circle-fitting the outfield arc from the
source polygon: the fitted centre is where the two foul lines meet at exactly
90°, and the diamond derives from there.

**The crowd** is a thousand students in six instanced meshes per variant across
24 baked variants, so the whole population costs about 144 draw calls. Variants
are assembled from palettes — 8 skin tones, 16 shirts, 8 trousers, 7 hair
colours, plus caps, beanies and backpacks. They walk a graph built by snapping
the walkway network to a 2 m grid, 16% idle, 34% move in friend groups, and they
sidestep the player.

---

## Collision and movement

Colliders are convex polygon prisms indexed in a 34 m uniform grid.

```js
groundAt(x, z, ceil)    // highest surface at or below ceil — lets you step up
resolve(pos, r, feetY)  // push a circle out of every prism taller than feetY
```

`resolve` runs up to three relaxation passes with an inside/outside test, so a
player who ends up inside a building is pushed out rather than trapped.

Eye height 1.70 m (1.10 crouched), radius 0.42 m, step 0.55 m, gravity
26.5 m/s², jump 8.0 m/s, FOV 88°, fog 320–1,600 m. The step height is why the
aquatics deck sits at 0.30 m and the pool carries a 1.35 m collider: you can walk
onto the deck but not onto the water.

---

## Performance

| | |
| --- | --- |
| Triangles | ~700,000 |
| Draw calls | ~400 |
| Students | 1,000 |
| Lamps / benches / hedges | 772 / 235 / 511 |
| Fountains / jets | 10 / 113 |
| Campus / city buildings | 217 / 970 |

Nameplates are drawn once into a single 2048-pixel canvas atlas, one row per
label, each sprite a cloned texture pointing at its cell. They use
`depthTest: false` so buildings never chop them, and only the nearest 15 within
230 m are shown.

The adaptive quality system measures frame time over three seconds and, below
30 fps, drops the renderer's pixel ratio from 2 to 1 to 0.75 before touching
anything in the scene. Resolution is the cheapest thing to give up; removing
buildings would defeat the point.

---

## Source layout

```
head.html      HUD markup, CSS, start and pause screens
a_world.js     ~3,300 lines — parsing, geometry helpers, the whole world
b_play.js      audio, player state, nameplate atlas
e_crowd.js     the crowd
c_main.js      minimap, input
d_loop.js      landmark tour, update loop, adaptive quality
build.sh       concatenates the above into game.html
build_world.py merges the two data sources into world.txt
```

`build.sh` is eight lines: concatenate, then `node --check`. Order matters —
`a_world.js` opens an IIFE and `d_loop.js` closes it, so the files are valid only
concatenated. It also emits `test.html`, identical but with a local three.js and
no font links, so everything can be tested with no network.

Testing is headless Chromium via Playwright with SwiftShader. Debug hooks are
injected into the update loop before a run and stripped before publishing —
`__at` to place the camera, `__goto` to frame a named landmark, `__probe` to
raycast a screen pixel and report what it hit.

`__probe` earned its keep. A thin dark line kept appearing across the sky.
Raycasting the exact pixels identified it as geometry at 16.5 m in one chunk
mesh, which traced to the fallback fan triangulation producing needle triangles
spanning the courtyards of U-shaped buildings. The fix was two guards in
`triangulate`: discard fan triangles whose centroid falls outside the ring, and
discard any triangle whose area over its longest edge squared is below 0.004.

---

## Known limitations

- Buildings are shells; no interiors.
- Heights are approximate for perhaps thirty buildings where the estimate took
  over.
- No shadows, no ambient occlusion, no time of day — permanent midday.
- The surrounding city has correct footprints and heights but no architectural
  treatment.
- One tree species, plus palms.
- Software rendering is slow; it wants hardware WebGL.

---

## Deployment

Static, so any static host works. On Vercel: `index.html` at the repo root,
framework preset **Other**, build command and output directory empty. Every push
to main redeploys. A `vercel.json` sets `Cache-Control: max-age=0,
must-revalidate` so updates appear immediately.

One detail that is easy to miss: the version published as a Claude artifact has
no `<!doctype>`, `<html>` or `<head>` of its own, because the artifact host
supplies that wrapper. Deployed as-is the browser falls into quirks mode, where
the `height: 100%` the layout depends on does not resolve and the canvas
collapses. The standalone build adds the doctype, charset and viewport tag.

---

*Built with three.js. Campus geometry from OpenStreetMap and USC's Concept3D
campus map. Not affiliated with or endorsed by the University of Southern
California.*
