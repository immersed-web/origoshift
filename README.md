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
- **Auth server** - a nodejs server handling user authentication as well as CRUD-operations for the users. It provides JWT access tokens to validated users that will be used by the clients when interacting with the mediaserver.
- **PostgreSQL** - a docker container running PostgreSQL.
- **Database** - A node project responsible for handling the interactions with the PostgreSQL database using [Prisma 2](https://www.prisma.io/).

#### Caddy - /backend/caddy/
The reverse proxy (and static file) server is an instance of [Caddy v2](https://caddyserver.com/). Caddy is a server software written in the language Go. It has built in functionality for retrieving and setting up https certificates using the free, open and automated certificate authority, [Let's Encrypt](https://letsencrypt.org/). In this project, Caddy is set up to act as both a static file server as well as a reverse proxy to the other running server applications. The configuration of how Caddy handles incoming requests is defined in the file named Caddyfile.

#### Database - /backend/database/
The naming of this folder/application can be a bit misleading. This folder hosts the tools/software needed to interact with the database. It doesn't contain the actual database itself.
The project uses [Prisma 2](https://www.prisma.io/), a typescript compatible [ORM](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping). Prisma is handling database migrations, seeding and generation of a typescript database client. the generated client is directly used by the other applications such as Auth server and mediaserver.