#!/bin/sh

set -ex

echo "Testing for running docker"
docker ps > /dev/null

echo "Building docker image with UI and API using Docker"
docker buildx build --platform linux/amd64 --push -t d3v01d/simplefinance:stable .

echo "Build complete!"