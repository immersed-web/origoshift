# Inclubit 360 v2
Inclubit 360 is a solution for enabling real-time communication between a 360 camera and a VR-headset. The system is implemented using web technologies. The client side consists of a website running in a browser.
This repository is version 2 of inclubit which expands on the features available in [version 1](https://github.com/Dealerpriest/inclubit-360).
New features in version 2 includes:
- multiple peers on both receiving and sending side (multiple cameras and multiple clients)
- session hosts can share screen that'll show up in VR for clients.
- clients can "raise hand" to call the hosts attention.
- hosts can cover parts of the 360 view to hide sensitive parts of the environment from the clients.
- users (hosts and client) can be grouped into "sections" where they'll only be able to see camera streams created in that "section".
- hosts can enable a "door" for a camera stream which will require the host to approve a client before they'll get access to a camerastream.

## App / Website
The source code for the client side is implemented using the web framework [Quasar](https://quasar.dev/). Quasar has built in support for deploying the source code as either of:
  - Website
    - Single Page Application (SPA)
    - Server Side Rendered website (SSR)
    - Progressive Web App (PWA)
  - Mobile App (Android and IOS)
  - Desktop App (Windows and OSX)

In this project the main focus has been to deploy the application as an SPA. It should (in theory) be possible, though, to deploy it as any of the others, for example a PWA.

## Backend

### Overview
The backend consists of a few different server programs that are needed to host and serve the website content, handle authentication, as well as handle communication and mediastreaming between all the peers.

The different server applications are:
- **Caddy** - Reverse proxy and static file server with automatic HTTPS
- **Media Server** - A custom nodejs server using the [mediasoup](mediasoup.org) SFU and websockets ([uWebSockets](https://github.com/uNetworking/uWebSockets)) to handle all media streaming and communication between the clients.
- **Auth Server** - a nodejs server handling user authentication as well as [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) operations for the users. It provides [JWT](https://en.wikipedia.org/wiki/JSON_Web_Token) access tokens to validated users that will be used by the clients when interacting with the mediaserver.
- **PostgreSQL** - a docker container running PostgreSQL.
- **Database** - A node project responsible for handling interactions with the PostgreSQL database using [Prisma 3](https://www.prisma.io/).

### Caddy
The reverse proxy (and static file) server is an instance of [Caddy v2](https://caddyserver.com/). Caddy is a server software written in the language Go. It has built in functionality for retrieving and setting up https certificates using the free, open and automated certificate authority, [Let's Encrypt](https://letsencrypt.org/). In this project, Caddy is set up to act as both a static file server as well as a reverse proxy to the other running server applications. The configuration of how Caddy handles incoming requests is defined in the file named Caddyfile.

### Media Server - /backend/mediaserver/
This is a node project and responsible for handling all the communication between connected peers. All data (media or other relevant communication) passes through this application. This application is an SFU (Selective Forwarding Unit) which basically means it is responsible for forwarding incoming media from connected clients to the correct recipients. The SFU part is implemented using a node module called [mediasoup](mediasoup.org). "Signaling" and syncronization of client states is achieved with websockets using the highly performant library [uWebSockets](https://github.com/uNetworking/uWebSockets)
### Auth Server - /backend/auth/
This is a node project responsible for authenticating clients. Also this server holds the endpoints for reading/writing to the users data. These endpoints are primarily used by admin users to create/edit/delete users or user groups.

### PostgreSQL - /docker-compose.yml
This is a docker compose file in the project root folder for running PostgreSQL as a docker container. Docker compose is typically used to run several containers together. In this case though, compose is primarily used for its convenient way to declare ports and mount volumes.
>**Note**: the settings for the database found in the .env file is only used on the **initial container startup**, and thus you should make sure to set the settings for the database in the .env file **before** running docker compose (init_database.sh & update.sh).

### Database - /backend/database/
The naming of this folder/application can be a bit misleading. This folder hosts the tools/software needed to interact with the database. It doesn't contain the actual database itself.
The project uses [Prisma 3](https://www.prisma.io/), a typescript compatible [ORM](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping). Prisma is handling database migrations, seeding and generation of a typescript database client. the generated client is then exported and used by the other applications such as the Auth Server.

## Installation
> **Prerequisites**: Initially you will need [Git](https://git-scm.com/) to be able to fetch the repository. Git is installed by default on most linux systems. There are some additional dependencies that is needed to run the project. There are a few bash scripts included in the repository to help with installing and running the project. Have a look below in the section [Bash utility scripts](#bash-utility-scripts)

### .env
This project relies on an .env file to configure relevant aspects of the system.
There is an example called `example.env` in the root folder of the project. This is just an example file. You need to create an .env file (the filename should be **.env**, only), and in this file provide the relevant settings. One way would be to make a copy of the example file with the name .env and change the settings in the new file:
```
cp example.env .env
```
- I strongly advice against using dollarsigns (\$) anywhere in the .env file as that might fuck up everything (\$ is used for variables in linux).
- Should probably be careful with backslash (\\) too.

The example file looks like this:
```
SERVER_URL="example.com"

# The public IP of the server
LISTEN_IP="123.123.123.123"

AUTH_URL="https://example.com"
AUTH_PORT=""
AUTH_PATH="/auth"

MEDIASOUP_URL="wss://example.com"
MEDIASOUP_PORT=""
MEDIASOUP_PATH="/socket"

# Be aware! The database variables are used on INITIAL STARTUP of the database container only. So change these to appropriate values BEFORE creating the database container.
# If you end up needing to change the database password, the easiest way would be to wipe the whole db:
# run docker compose down -v and then delete the folder ./docker-data/postgres
# I think kungsbacka had problems when they had a hash sign "#" or parentheses "(" in their database password.
# I haven't verified this, but perhaps avoid those characters for this password?
DATABASE_PASSWORD="megasecretdatabasepassword"
DATABASE_NAME="inclubit"
# Prisma cli supports expanding env vars. dotenv-cli apparently also does. So we should be fine!
DATABASE_URL="postgresql://postgres:${DATABASE_PASSWORD}@localhost:5432/${DATABASE_NAME}?schema=public"

# changing this (and restarting) should logout everyone by invalidating their sessions. Haven't tried though...
SESSION_KEY="secretKeyUsedByTheUserSessions"

ADMIN_PASSWORD="PLEASEchangeMEorIwillCRYtrueTEARSofSADNESS"

JWT_SECRET="SOOOOOSECRETPLEASEPUTGOODPASSWORDHERE"
JWT_ISSUER="Inclubit auth server"
JWT_AUDIENCE="inclubit application"
```
A normal setup would require setting new values for:
- SERVER_URL
- AUTH_URL
- MEDIASOUP_URL
- ADMIN_PASSWORD
- DATABASE_PASSWORD
- SESSION_KEY
- JWT_SECRET
- LISTEN_IP


The rest could be left as is.

### Installation steps
To install inclubit 2 and run it on your own server, you first need to retrieve the repository from github.
Using the terminal, go to your home folder on the server:
```
cd ~
```
Clone the repository from github:
```
git clone https://github.com/inclubit/inclubit-2.git
```
- Create a .env file according to the instructions in the [.env section](#.env) above.

Now let's install and setup everything.
cd into SCRIPT folder:
```
cd inclubit-2/SCRIPT`
```
Make all the bash scripts in the folder executable (in case they're not).
```
chmod +x *.sh
```
Setup all the system wide tools and dependencies
```
./setup-environment.sh
```
Reboot the system so the user group changes take effect
```
sudo reboot
```
You will probably get kicked out (if you're connected with SSH). Reconnect when the server has rebooted and go back to the SCRIPT folder.

Give Caddy server permission to bind to low port numbers
```
sudo bash give-caddy-port-permission.sh
```

Install the internal project dependencies and build the apps 📡
```
./install-dependencies.sh
```
The script will tell you to manually setup autostart for PM2. Follow those instructions.


Now let's initialize the database:
```
./init-database.sh
```
Now let's run the project 🚀:
```
./start.sh
```


### Update to new version
If you want to update to a new version available on github, you need to
- stop the applications
- pull the new changes from github
- update and build the applications
- start the applications again.

Luckily, the provided shell scripts can aid you in this venture!
Steps:
- go to the scripts folder `cd ~/inclubit-2/SCRIPTS`
- run `./stop.sh`
- run `./update.sh`  (if you have made local changes you might have to discard those before being able to pull)
- run `./start.sh`


### Bash Utility Scripts
There are some shell scripts provided to help with installing, updating and running the applications:
* `setup-environment.sh` - This script will attempt to setup the ubuntu system with all the sytem wide dependencies and tools required to run the project.
* `give-caddy-port-permission.sh` - This scripts sets permissions so that caddy server can bind to low port numbers. Run it as root by calling **`sudo bash give-caddy-port-permission.sh`**
* `install-dependencies.sh` - This script will install and build all the individual apps that makes up the project.
* `init-database.sh` - This script will initialize/reset the database with the default data. Default data is one admin user with the password defined in the **.env** file.
* `update.sh` - This script will try to pull the latest changes from github, then update and build the applications as well as apply any new database migrations.
* `dev.sh` - This script runs the whole project in development mode, including hot reloading etc. This should only be used during development and not to run the project in production for "real" users.
* `start.sh` - This script will run all the applications. The script uses [pm2](https://pm2.keymetrics.io/), a process manager, to run all the applications in the project.
* `stop.sh` - This script will stop all the processes started by pm2 and delete them from the process list.

>**Tip:** If you can't seem to run the scripts it can be that they aren't marked as executables and thus the `./file.sh` syntax won't work. You could then either use `chmod +x file.sh` to make a file executable, or perhaps easier, run them like so `/bin/bash file.sh`

## Monitoring
The applications are run with a tool called pm2 that gets installed by the `install-dependencies.sh`-script. You can interact directly with pm2 using the command line. Here's a few examples:

To list the processes managed by pm2 and their status:
```
pm2 ls
```

To have a real-time look at what the applications are printing to the console while running, run:
```
pm2 logs
```

To do the same for only one running process, append the name. For example:
```
pm2 logs mediaserver
```

To get a terminal based overview dashboard, run:
```
pm2 monit
```

## Ports
The following ports are required to be opened on the server:

| Ports | Protocol  | Description |
| -------: | -------: | :----- |
| 22    | TCP       | If you need to SSH in to the server (you will) |
| 80    | TCP       | Serve standard http requests |
| 443   | TCP       | Serve standard https requests |
| 40000-49999 | UDP | ports for the SFU mediaserver |

## Credit
The project to develop and create this software was initiated by Lèv Grunberg.
The development was a collaboration between the following organisations:
- Reasearch Institutes of Sweden (RISE)
- Kungsbacka Kommun

## Copyright & License
This codebase (excluding external dependencies, such as libraries and/or software frameworks) is written by me, Gunnar Oledal.
External dependencies, such as libraries and/or software frameworks in this repository, holds up to their own respective licenses.

```
Inclubit 360. Web application for realtime streaming of 360 video to Virtual Reality
Copyright (c) 2022-present Gunnar Oledal gunnar.oledal@gmail.com

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
```
