#!/bin/sh

. bin/prod/variables.sh

# Build images
docker buildx build --build-arg USER_ID="$USER_ID" --build-arg GROUP_ID="$GROUP_ID" --platform linux/amd64 --no-cache -f ./docker/"$1"/Dockerfile -t "$IMAGE_REPOSITORY"/"$PROJECT"-"$1":"$2" .

# $1 image
# $2 version