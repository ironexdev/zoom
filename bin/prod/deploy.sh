#!/bin/sh

source bin/variables.sh

# Deploy stack
docker stack deploy $PROJECT -c docker-compose.prod.yml