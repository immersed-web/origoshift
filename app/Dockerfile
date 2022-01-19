FROM node

WORKDIR /usr/app
COPY --from=shared-types /usr/shared-types/dist ./
RUN ls
# COPY package.json