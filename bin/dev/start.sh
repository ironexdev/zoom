#!/bin/sh

. bin/dev/variables.sh

# Build images if needed and create and start containers
docker-compose up -d $@