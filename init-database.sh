#!/bin/bash

# Function to display commands
stage() { echo ' '; echo ' '; echo '========================================='; echo "\$ $@" ; echo '========================================='; echo '  ';}
say() { echo ' '; echo '#############'; echo "\$ $@" ; echo '';}
exe() { echo "\$ $@" ; "$@" ; }

say 'spin up the postgres database (if not already running)'
exe docker compose up -d

say 'reset database'
exe yarn workspace database run migrate:reset --force