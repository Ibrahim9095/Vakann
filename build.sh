#!/bin/bash
cd Talent-Hubzip
pnpm install
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/jobera run build
cd artifacts/api-server
node build.mjs
mkdir -p public
cp -r ../jobera/dist/public/* ./public/
