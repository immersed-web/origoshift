#!/bin/bash

BASEDIR=$(dirname $BASH_SOURCE)
cd $BASEDIR
source utility.sh

cd_to_project_root

say 'stopping and removing all pm2 processes'
exe pm2 stop ecosystem.config.js
exe pm2 delete ecosystem.config.js

if [[ ! -v DEVELOPMENT ]]; then
  say 'starting pm2'
  exe pm2 start ecosystem.config.js
  say 'saving the started processes to autostart script'
  exe pm2 save
else
  say 'starting pm2 attached for development'
  exe pm2 start ecosystem.config.js --attach
fi

