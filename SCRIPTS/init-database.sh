#!/bin/bash

BASEDIR=$(dirname $BASH_SOURCE)
cd $BASEDIR
source utility.sh

stage 'Welcome to the database init/reset script!!
| This script will reset the database to its default initial state.'
read -p "WARNING! This will erase everything in the database. Press ENTER to continue. Press ctrl-c to cancel."

cd_to_project_root

say 'spin up the postgres database (if not already running)'
exe docker compose up -d

say 'waiting for postgresql to be ready for connections'
while !</dev/tcp/localhost/5432; do sleep 1; done;

say 'install dependencies in database workspace package'
exe pnpm install --filter database

say 'reset database'
exe pnpm --filter=database migrate:reset --force
