#!/bin/bash
set -e
cd "$(dirname "$0")"
cat head.html > game.html
echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>' >> game.html
echo '<script id="osmdata" type="text/plain">' >> game.html
cat world.txt >> game.html
echo '</script>' >> game.html
echo '<script>' >> game.html
cat a_world.js a2_coliseum.js a2b_assoc.js a2c_rose.js a2d_nhm.js a2e_sci.js a3_landscape.js b_play.js e_crowd.js c_main.js d_loop.js > all.js
node --check all.js
cat all.js >> game.html
echo '</script>' >> game.html
sed -e 's#<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>#<script src="three.local.js"></script>#' -e '/fonts.googleapis.com|fonts.gstatic.com/d' game.html > test.html
echo "built $(wc -c < game.html) bytes"
