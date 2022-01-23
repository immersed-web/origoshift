FROM project-folder

WORKDIR /projectroot/backend/mediaserver

# we copy package and run install first, in order to get better docker layers cache goodness
COPY ./package*.json ./
# RUN apt-get update
# RUN apt-get install python3 python3-pip -y
RUN yarn
COPY . .
EXPOSE 9001
# VOLUME ["./types"]
# CMD [ "yarn", "run", "dev"]
RUN yarn build
CMD [ "yarn", "start" ]
# RUN chmod +x entrypoint.sh
# RUN chmod +x entrypoint.dev.sh
# ENTRYPOINT [ "./entrypoint.sh" ]
