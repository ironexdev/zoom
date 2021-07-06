#!/bin/sh

. bin/dev/variables.sh

# Deploy stack
docker stack deploy $PROJECT -c docker-compose.prod.yml