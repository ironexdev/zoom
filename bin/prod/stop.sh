#!/bin/sh

. bin/dev/variables.sh

# Stop stack
docker stack rm $(PROJECT)