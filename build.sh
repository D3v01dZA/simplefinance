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
cd ../api
rm -rf ./src/main/resources/static/*
mkdir -p ./src/main/resources/static
cp -r ../ui/build/* ./src/main/resources/static/
cp ../ui/fav.svg ./src/main/resources/static/assets/

echo "Changing database url"
git checkout ./src/main/resources/application.properties
sed -i '' 's|database.db|/data/database.db|g' ./src/main/resources/application.properties

echo "Building jar"
./gradlew build

echo "Building docker image"
docker buildx build --platform linux/amd64 --push -t d3v01d/simplefinance:latest .

git checkout ../ui/src/app/serverSlice.ts
git checkout ./src/main/resources/application.properties
rm -rf ./src/main/resources/static/*
