FROM node as types-builder
WORKDIR /usr/shared-types
RUN apt-get update
RUN apt-get install build-essential
RUN apt-get install -y python3-pip
# RUN npm install -g yarn
COPY package.json .
RUN yarn
COPY . .
RUN yarn build