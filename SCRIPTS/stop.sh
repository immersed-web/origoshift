
#!/bin/bash

# Functions to display commands
stage() { echo ' '; echo ' '; echo '========================================='; echo "\$ $@" ; echo '========================================='; echo '  ';}
say() { echo ' '; echo '#############'; echo "\$ $@" ; echo '';}
exe() { echo "\$ $@" ; "$@" ; }

cd ..

say 'stoping all pm2 processes'
exe pm2 stop ecosystem.config.js
exe pm2 delete ecosystem.config.js