#!/bin/sh

set -e

echo "Testing for running docker"
docker ps > /dev/null

echo "Changing ui server"
cd ui
git checkout ./src/app/serverSlice.ts
sed -i '' 's|http://localhost:8080|\.|g' ./src/app/serverSlice.ts
echo "Building ui"
npm run build

echo "Copying ui assets"
cd ../api-rust
rm -rf ./static/*
mkdir -p ./static/
cp -r ../ui/build/* ./static/
cp ../ui/fav.svg ./static/

echo "Building docker image"
docker buildx build --platform linux/amd64 --push -t d3v01d/simplefinance:stable .

git checkout ../ui/src/app/serverSlice.ts
rm -rf ./static/*
git checkout ./static/*
