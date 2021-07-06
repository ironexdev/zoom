#!/bin/sh

. bin/dev/variables.sh

# Stop running containers
docker-compose down $@