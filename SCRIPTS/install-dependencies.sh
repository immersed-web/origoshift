#!/bin/bash

BASEDIR=$(dirname $BASH_SOURCE)
cd $BASEDIR
source utility.sh

stage 'Gunnar är bäst!'

stage 'Welcome to the install script!
| This script will attempt to install EVERYTHING needed to run inclubit 2 on the server.
| Tested on ubuntu only. The script is designed to run as a non-root user I.E. without "sudo" in front.
| The script prints out what it is doing so you can have fun and follow along :-)'

read -p "Press ENTER to continue. Press ctrl-c to cancel."

cd_to_project_root

export NEEDRESTART_MODE=a
say 'Updating package register'
exe sudo apt-get update

stage 'Node, PNPM and other global javascript/node dependencies'
say 'Install NVM (node version manager)'
exe curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

say 'Source nvm so we can call it from within this shell script'
. ~/.nvm/nvm.sh
. ~/.profile
. ~/.bashrc

say 'Install node LTS'
exe nvm install --lts

say 'Verify node is installed'
exe node --version

say 'Install PNPM node package manager'
exe corepack enable
exe corepack prepare pnpm@latest --activate

say 'Verify PNPM is installed'
exe pnpm --version
# pnpm setup makes sure the global bin dir gets set
exe pnpm setup

say 'we need to reload bashrc so the added global pnpm bin dir is available'
exe source ~/.bashrc

say "Install dotenv-cli so we can inject env files when running npm scripts"
exe pnpm add dotenv-cli -g

say 'Install pm2'
exe pnpm add pm2 -g

say 'Verify pm2 is installed'
exe pm2 --version

say 'Install quasar cli'
exe pnpm add @quasar/cli -g

say 'Verify quasar cli is installed'
exe quasar --version

stage 'Mediasoup dependencies'
say 'Install python and PIP'
exe sudo apt-get --yes install python3 python3-pip
say 'Check python is callable'
exe python3 --version

say 'Install make and gcc/g++'
exe sudo apt-get --yes install build-essential

stage 'CADDY Server'
say 'Get caddy dep package'
exe sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
exe curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
# Dont use this next line with the exe function. it fucks up apt
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
say 'update index after fetching pack'
exe sudo apt-get update
say 'actually install caddy'
exe sudo apt install caddy

stage 'DOCKER STUFF'

say 'Set up docker repository to be installed with apt'
exe sudo apt-get install \
    ca-certificates \
    gnupg \
    lsb-release -y

exe sudo mkdir -p /etc/apt/keyrings
exe curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

say 'Install DOCKER!!!'
exe sudo apt-get update
exe sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

say 'Make sure docker runs'
exe sudo systemctl start docker

say 'Verifying docker is installed'
exe docker --version

say 'Adding current user to the docker user group'
exe sudo groupadd docker
username=$USER
exe sudo usermod -aG docker $username

# say 'Creating a directory for mounting docker persistent volumes'
# exe mkdir ~/docker-persistence
# say 'Give ownership to container user (UID 1001) and docker group'
# exe chown 1001:docker ~/docker-persistence/
# say 'Give read & write access to groups attached to folder'
# exe chmod g+rw ~/docker-persistence


stage 'We will use a tool called PM2 to run, monitor and manage all the apps/processes.
| PM2 has functionality to automatically (re)start a saved list of processes when the server reboots.
| PM2 should have been installed earlier in this script, but the autostart functionality must be manually activated.
| Instructions can be found here:
| https://pm2.keymetrics.io/docs/usage/startup/
|
| In short the procedure is to run:
| pm2 startup
| then copy the output produced from running that command and paste it back into the terminal and run it.'
read -p "Press ENTER when you have read and understood the above."

stage 'The script is finished. Please look through the output so there werent any sad errors.'

echo '    '
echo 'NOW LOG OUT THE USER AND LOG IN AGAIN. OTHERWISE THE USER WILL NOT BE CONSIDERED PART OF THE DOCKER USER GROUP'
echo 'YOU MIGHT EVEN HAVE TO REBOOT THE SYSTEM FOR THE CHANGES TO TAKE EFFECT. if so, run "sudo reboot"'
echo '    '
echo '-------------------------------'
echo '==============================='
