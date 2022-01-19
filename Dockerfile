# TODO: Make sure we only pass along the relevant parts between the build stages!

FROM node:lts as pkg-installer
# WORKDIR /usr/projectroot
RUN apt-get update
RUN apt-get install build-essential
RUN apt-get install -y python3-pip

#create root folder
FROM pkg-installer as project-folder
WORKDIR /projectroot
COPY package.json .
COPY tsconfig.json .
COPY yarn.lock .
# COPY augmented-types.d.ts .
RUN yarn global add typescript

# COPY . .
# RUN yarn build

FROM project-folder

#database
WORKDIR /projectroot
COPY ./backend/database ./backend/database
RUN cd backend && ls
# WORKDIR /projectroot/shared-types
# RUN yarn
# RUN yarn build

#shared-types
WORKDIR /projectroot
COPY ./shared-types ./shared-types
WORKDIR /projectroot/shared-types
RUN yarn
RUN yarn build

#shared-modules
# FROM project-folder
WORKDIR /projectroot
COPY ./backend/shared-modules ./backend/shared-modules
WORKDIR /projectroot/backend/shared-modules
RUN yarn
RUN yarn build

WORKDIR /projectroot
RUN ls
RUN cd backend && ls