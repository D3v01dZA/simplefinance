#!/bin/sh

set -e

echo "Tagging latest as stable"
cd api-rust
docker buildx build --platform linux/amd64 --push -t d3v01d/simplefinance:stable .
