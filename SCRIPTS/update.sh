#!/bin/bash

BASEDIR=$(dirname $BASH_SOURCE)
cd $BASEDIR
source utility.sh

# Functions to display commands
# stage() { echo ' '; echo ' '; echo '========================================='; printf "| $@" ; echo '========================================='; echo '  ';}
# say() { echo ' '; echo '#############'; echo "\$ $@" ; echo '';}
# exe() { echo "\$ $@" ; "$@" ; }

stage 'Welcome to the update script!
|
| This script tries to update the project to latest changes from the github repository.
| Then it updates and builds each of the sub applications.
| It also deploys any pending database migrations.\n'
read -p "Press ENTER to continue. Press ctrl-c to cancel."

cd_to_project_root

say 'Pull latest git changes'
exe git pull

say 'install/update all npm projects'
exe pnpm install

say 'build all the npm projects'
exe pnpm -r build

# say 'build the prisma client'
# exe pnpm --filter database generate

say 'spin up the postgres database (if not already running)'
exe docker compose up -d

say 'waiting for postgresql to be ready for connections'
while !</dev/tcp/localhost/5432; do sleep 1; done;

say 'deploy database migrations'
exe pnpm --filter database migrate:deploy
