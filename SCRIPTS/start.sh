#!/bin/bash

# Functions to display commands
stage() { echo ' '; echo ' '; echo '========================================='; echo "\$ $@" ; echo '========================================='; echo '  ';}
say() { echo ' '; echo '#############'; echo "\$ $@" ; echo '';}
exe() { echo "\$ $@" ; "$@" ; }

cd ..

# set -a
# source .env
# set +a
# caddy start


say 'stopping and removing all pm2 processes'
exe pm2 stop ecosystem.config.js
exe pm2 delete ecosystem.config.js

say 'starting pm2 and attach to log output'
exe pm2 start ecosystem.config.js

# say 'saving the started processes to autostart script'
# exe pm2 save
