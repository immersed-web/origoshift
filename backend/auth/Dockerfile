# FROM node:16
# WORKDIR /root
# # project folder with shared stuff
# COPY --from=project-folder /projectroot .

FROM project-folder

# WORKDIR /projectroot/backend/database
WORKDIR /projectroot/backend/auth
# we copy package and run install first, in order to get better docker layers cache goodness
COPY ./package*.json ./
RUN ls
RUN cd .. && ls
RUN yarn
RUN yarn generate
COPY . .
RUN ls
EXPOSE 3333
# VOLUME ["./types"]
# CMD [ "yarn", "run", "dev"]
CMD [ "yarn", "start" ]
# RUN chmod +x entrypoint.sh
# RUN chmod +x entrypoint.dev.sh
# ENTRYPOINT [ "./entrypoint.sh" ]
