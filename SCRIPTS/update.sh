#!/bin/bash

# Functions to display commands
stage() { echo ' '; echo ' '; echo '========================================='; printf "| $@" ; echo '========================================='; echo '  ';}
say() { echo ' '; echo '#############'; echo "\$ $@" ; echo '';}
exe() { echo "\$ $@" ; "$@" ; }

cd ..

stage 'Welcome to the update script!
|
| This script tries to update the project to latest changes from the github repository.
| Then it updates and builds each of the sub applications.
| It also deploys any pending database migrations.\n'
read -p "Press ENTER to continue. Press ctrl-c to cancel."

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