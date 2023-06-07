#!/bin/sh

set -e

echo "Tagging latest as stable"
docker tag d3v01d/simplefinance:latest d3v01d/simplefinance:stable
docker push d3v01d/simplefinance:stable
