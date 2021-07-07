#!/bin/sh

. bin/prod/variables.sh

# Stop stack
docker stack rm $(PROJECT)