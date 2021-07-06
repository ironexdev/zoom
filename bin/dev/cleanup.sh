#!/bin/sh

. bin/dev/variables.sh

# Stop running containers, remove images and volumes
sh bin/dev/stop.sh -v --rmi all

# Remove stopped containers
docker-compose rm