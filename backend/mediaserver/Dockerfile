FROM node:16

WORKDIR /usr/app
# we copy package and run install first, in order to get better docker layers cache goodness
COPY ./package*.json ./
RUN yarn
COPY . .
EXPOSE 9001
# VOLUME ["./types"]
# CMD [ "yarn", "run", "dev"]
CMD [ "yarn", "start" ]
# RUN chmod +x entrypoint.sh
# RUN chmod +x entrypoint.dev.sh
# ENTRYPOINT [ "./entrypoint.sh" ]
