#!/bin/sh

source bin/variables.sh

# Stop running containers
docker-compose down $@