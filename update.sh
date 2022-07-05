#!/bin/bash

# Functions to display commands
stage() { echo ' '; echo ' '; echo '========================================='; echo "\$ $@" ; echo '========================================='; echo '  ';}
say() { echo ' '; echo '#############'; echo "\$ $@" ; echo '';}
exe() { echo "\$ $@" ; "$@" ; }

stage 'Welcome to the update script. This script updates the project to latest changes. Then it updates each of the sub applications with yarn'
say 'Pull latest git changes'
exe git pull
# say 'install/update all npm projects with yarn'
exe yarn

say 'build all the npm projects'
exe yarn workspaces run build

say 'build the prisma client'
exe yarn workspace database run generate

say 'spin up the postgres database (if not already running)'
exe docker compose up -d

say 'waiting for postgresql to be ready for connections'
while !</dev/tcp/localhost/5432; do sleep 1; done;

say 'deploy database migrations'
exe yarn workspace database run migrate:deploy