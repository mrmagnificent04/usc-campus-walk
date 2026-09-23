#!/bin/bash
set -e
cd "$(dirname "$0")"
cp d_loop.dev.js d_loop.js && ./build.sh && cp test.html testdev.html
cp d_loop.rel.js d_loop.js && ./build.sh
