#!/bin/sh

set -e

echo "Changing ui server"
cd ui
git checkout ./src/app/serverSlice.ts
sed -i 's|http://localhost:8080|\.|g' ./src/app/serverSlice.ts
echo "Building ui"
npm run build

echo "Copying ui assets"
cd ../api
rm -rf ./src/main/resources/static/*
cp -r ../ui/build/* ./src/main/resources/static/

echo "Changing database url"
git checkout ./src/main/resources/application.properties
sed -i 's|database.db|/data/database.db|g' ./src/main/resources/application.properties

echo "Building jar"
./gradlew build

echo "Building docker image"
IMAGE=$(docker build . -q)
echo "Docker image ${IMAGE}"

docker tag "${IMAGE}" d3v01d/simplefinance:latest
docker push d3v01d/simplefinance:latest

git checkout ../ui/src/app/serverSlice.ts
git checkout ./src/main/resources/application.properties
rm -rf ./src/main/resources/static/*
