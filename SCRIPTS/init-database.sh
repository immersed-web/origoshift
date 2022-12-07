#!/bin/bash

# Function to display commands
stage() { echo ' '; echo ' '; echo '========================================='; printf "| $@" ; echo '========================================='; echo '  ';}
say() { echo ' '; echo '#############'; echo "\$ $@" ; echo '';}
exe() { echo "\$ $@" ; "$@" ; }

stage 'Welcome to the database init/reset script!!
| This script will reset the database to its default initial state.
'
read -p "WARNING! This will erase everything in the database. Press ENTER to continue. Press ctrl-c to cancel."

say 'Changing directory to project root'
BASEDIR=$(dirname $BASH_SOURCE)
exe cd $BASEDIR/..

say 'spin up the postgres database (if not already running)'
exe docker compose up -d

say 'waiting for postgresql to be ready for connections'
while !</dev/tcp/localhost/5432; do sleep 1; done;

say 'install dependencies in database workspace package'
exe pnpm install --filter database

say 'reset database'
exe pnpm --filter=database migrate:reset --force
