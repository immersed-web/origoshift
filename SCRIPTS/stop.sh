
#!/bin/bash

BASEDIR=$(dirname $BASH_SOURCE)
cd $BASEDIR
source utility.sh

# Functions to display commands
# stage() { echo ' '; echo ' '; echo '========================================='; echo "\$ $@" ; echo '========================================='; echo '  ';}
# say() { echo ' '; echo '#############'; echo "\$ $@" ; echo '';}
# exe() { echo "\$ $@" ; "$@" ; }

cd_to_project_root

say 'stopping all pm2 processes'
exe pm2 stop ecosystem.config.js
exe pm2 delete ecosystem.config.js
