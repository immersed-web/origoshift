#!/bin/bash

BASEDIR=$(dirname $BASH_SOURCE)
cd $BASEDIR
source utility.sh

stage 'Gunnar är bäst!'

stage 'Welcome to the dependencies install script!
| This script will install the internal dependencies for each of the individual apps/services that make up ths project
| Another script is responsible for the system wide dependencies and should have been run BEFORE this script.
| Tested on ubuntu only. The script is designed to run as a non-root user I.E. without "sudo" in front.
| The script prints out what it is doing so you can have fun and follow along :-)'

read -p "Press ENTER to continue. Press ctrl-c to cancel."

cd_to_project_root

export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

stage "GLOBAL NODE PACKAGES"
say "Install dotenv-cli so we can inject env files when running node scripts"
exe pnpm add -g dotenv-cli

say 'Install pm2'
exe pnpm add -g pm2

say 'Verify pm2 is installed'
exe pm2 --version

say 'Install quasar cli'
exe pnpm add @quasar/cli -g

say 'Verify quasar cli is installed'
exe quasar --version

stage "INSTALL NODE MODULES"
say "We will now run the install command for each of the individual apps/services that makes up this project."
exe pnpm install --reporter=append-only

say 'build only the shared packages'
exe pnpm --filter "./packages/**" -r build

say 'generate the prisma client'
exe pnpm --filter "database" generate

say 'build all the node projects'
exe pnpm -r build

stage 'The script is finished. Please look through the output so there werent any sad errors.'

stage '         IMPORTANT
|
| We will use a tool called PM2 to run, monitor and manage all the apps/processes.
| PM2 has functionality to automatically (re)start a saved list of processes when the server reboots.
| PM2 should have been installed earlier in this script, but the autostart functionality must be manually activated.
| Instructions can be found here:
| https://pm2.keymetrics.io/docs/usage/startup/
|
| In short the procedure is to run:
| pm2 startup
| then copy the output produced from running that command and paste it back into the terminal and run it.
|
| You should do this after this script has finished.'
read -p "Press ENTER when you have read and understood the above."

