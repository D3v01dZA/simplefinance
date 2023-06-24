#!/bin/sh

set -e

echo "Tagging latest as stable"
cd api
docker buildx build --platform linux/amd64 --push -t d3v01d/simplefinance:stable .
