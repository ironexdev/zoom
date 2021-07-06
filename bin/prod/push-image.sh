#!/bin/sh

. bin/prod/variables.sh

# Push image
cd docker/"$1"
docker push "$IMAGE_REPOSITORY"/"$PROJECT"-"$1":"$2"

# $1 image
# $2 version