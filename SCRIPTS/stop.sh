
#!/bin/bash

# Functions to display commands
stage() { echo ' '; echo ' '; echo '========================================='; echo "\$ $@" ; echo '========================================='; echo '  ';}
say() { echo ' '; echo '#############'; echo "\$ $@" ; echo '';}
exe() { echo "\$ $@" ; "$@" ; }

say 'Changing directory to project root'
BASEDIR=$(dirname $BASH_SOURCE)
exe cd $BASEDIR/..

say 'stopping all pm2 processes'
exe pm2 stop ecosystem.config.js
exe pm2 delete ecosystem.config.js
