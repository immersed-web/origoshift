#!/bin/bash

# this din't work on ICE VM running Ubuntu
# if (( $EUID != 0 )); then

if [[ $(id -u) -ne 0 ]] ; then
    echo "Please run as root"
    echo 'This script runs a bunch of stuff that requires privileges in order to configure the environment'
    exit
fi

# Function to display commands
stage() { echo ' '; echo ' '; echo '========================================='; printf "| $@ \n" ; echo '========================================='; echo '  ';}
say() { echo ' '; echo '#############'; echo "\$ $@" ; echo '';}
exe() { echo "\$ $@" ; "$@" ; }

cd ..

stage 'Gunnar är bäst!'

stage 'Welcome to the install script!
| This script will attempt to install EVERYTHING needed to run inclubit 2 on the server.
| Tested on ubuntu only. 
| The script prints out what it is doing so you can have fun and follow along :-)'

read -p "Press ENTER to continue. Press ctrl-c to cancel."
# set -x
say 'Updating package register'
exe apt-get update

stage 'Node, yarn and other global javascript dependencies'
######### Node and yarn
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

say 'Install yarn'
exe npm install -G yarn

say 'Verify yarn is installed'
exe yarn --version

say 'Install pm2'
exe yarn global add pm2

say 'Verify pm2 is installed'
exe pm2 --version

# say 'Activate autostart for pm2'
# exe pm2 startup

say 'Install quasar cli'
exe yarn global add @quasar/cli

say 'Verify quasar cli is installed'
exe quasar --version

######### Mediasoup dependencies
stage 'Mediasoup dependencies'
say 'Install python and PIP'
exe apt install python3 python3-pip
say 'Check python is callable'
exe python3 --version

say 'Install make and gcc/g++'
exe apt install build-essential

##### CADDY
stage 'CADDY Server'
say 'Get caddy dep package'
exe apt install -y debian-keyring debian-archive-keyring apt-transport-https
exe curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
# Dont use this next line with the exe function. it fucks up apt
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
say 'update index after fetching pack'
exe apt update
say 'actually install caddy'
exe apt install caddy

######### DOCKER
stage 'DOCKER STUFF'

# say 'Remove any old docker stuff'
# exe apt-get remove docker docker-engine docker.io -y

say 'Set up docker repository to be installed with apt'
exe apt-get install \
    ca-certificates \
    gnupg \
    lsb-release -y

exe mkdir -p /etc/apt/keyrings
exe curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

say 'Install DOCKER!!!'
exe apt-get update
exe apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

say 'Make sure docker runs'
exe systemctl start docker

say 'Verifying docker is installed'
exe docker --version

say 'Adding current user to the docker user group'
exe groupadd docker
exe usermod -aG docker $USER

# say 'Installing docker compose'
# exe curl -L "https://github.com/docker/compose/releases/download/1.26.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
# say 'Giving docker compose permission to execute'
# exe chmod +x /usr/local/bin/docker-compose

# say 'Creating a directory for mounting docker persistent volumes'
# exe mkdir ~/docker-persistence
# say 'Give ownership to container user (UID 1001) and docker group'
# exe chown 1001:docker ~/docker-persistence/
# say 'Give read & write access to groups attached to folder'
# exe chmod g+rw ~/docker-persistence


echo '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^'
echo '###############################'
echo '-------------------------------'
echo '    '
echo 'NOW LOG OUT THE USER AND LOG IN AGAIN. OTHERWISE THE USER WILL NOT BE CONSIDERED PART OF THE DOCKER USER GROUP'
echo 'YOU MIGHT EVEN HAVE TO REBOOT THE SYSTEM FOR THE CHANGES TO TAKE EFFECT. if so, run "sudo reboot"'
echo '    '
echo '-------------------------------'
echo '==============================='