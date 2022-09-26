#!/bin/bash

# Function to display commands
stage() { echo ' '; echo ' '; echo '========================================='; printf "| $@" ; echo '========================================='; echo '  ';}
say() { echo ' '; echo '#############'; echo "\$ $@" ; echo '';}
exe() { echo "\$ $@" ; "$@" ; }

cd ..

stage 'Welcome to the database init/reset script!!
| This script will reset the database to its default initial state.
'
read -p "WARNING! This will erase everything in the database. Press ENTER to continue. Press ctrl-c to cancel."

say 'spin up the postgres database (if not already running)'
exe docker compose up -d

say 'waiting for postgresql to be ready for connections'
while !</dev/tcp/localhost/5432; do sleep 1; done;

# say 'install dependencies in database package'
# exe yarn workspace database install

exe npm install --workspace=database

say 'reset database'
exe npm run migrate:reset --workspace=database -- --force